
import { Router, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { workspaceService } from '../services/workspaceService';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';

const router = Router();

// Helper to get workspace IP
async function getWorkspaceIp(studentId: string): Promise<string | null> {
    try {
        // Type assertion since we know we're using Fargate in production
        const service = workspaceService as any;
        if (typeof service.getWorkspaceIp === 'function') {
            return await service.getWorkspaceIp(studentId);
        }
        return null;
    } catch (error) {
        logger.error('Failed to get workspace IP:', { studentId, error });
        return null;
    }
}

// Helper to verify workspace exists and is running
async function verifyWorkspaceAccess(req: any, studentId: string): Promise<boolean> {
    try {
        logger.info('Verifying access for student', {
            studentId,
            url: req.url,
            originalUrl: req.originalUrl,
            params: req.params
        });

        const { data, error } = await supabaseAdmin
            .from('students')
            .select('workspace_status, workspace_task_arn')
            .eq('id', studentId)
            .single();

        if (error || !data) {
            logger.warn('Student not found for workspace access', { studentId, error });
            return false;
        }

        logger.info('Workspace status check', {
            studentId,
            status: data.workspace_status,
            taskArn: data.workspace_task_arn
        });

        if (data.workspace_status !== 'running' || !data.workspace_task_arn) {
            logger.warn('Workspace not running', { studentId, status: data.workspace_status });
            return false;
        }

        return true;
    } catch (error) {
        logger.error('Error verifying workspace access:', { studentId, error });
        return false;
    }
}

// Proxy middleware
const workspaceProxy = createProxyMiddleware({
    target: 'http://localhost:8080',
    changeOrigin: true,
    ws: true, // Enable WebSocket proxying
    router: async (req: Request) => {
        try {
            // Extract studentId from URL using originalUrl because req.url is stripped by Express
            const url = req.originalUrl || '';
            const match = url.match(/\/workspace\/([a-zA-Z0-9-]+)/);
            const studentIdPart = match ? match[1] : null;

            if (!studentIdPart) {
                logger.error('No studentId found in proxy path', { url });
                return undefined;
            }

            const ip = await getWorkspaceIp(studentIdPart);
            if (!ip) {
                logger.error('No IP found for workspace', { studentId: studentIdPart });
                return undefined;
            }

            logger.info('Proxying to workspace', { studentId: studentIdPart, ip, port: 8080 });
            return `http://${ip}:8080`;
        } catch (error) {
            logger.error('Proxy router error:', error);
            return undefined;
        }
    },
    pathRewrite: (path: string, req: Request) => {
        // Strip /workspace/:studentId prefix
        // Input: /workspace/abc-123/some/path
        // Output: /some/path
        const rewritten = path.replace(/^\/workspace\/[a-zA-Z0-9-]+/, '');
        const finalPath = rewritten || '/';
        logger.debug('Path rewrite', { original: path, rewritten: finalPath });
        return finalPath;
    },
    on: {
        proxyReq: (proxyReq: any, req: any, res: any) => {
            // Extract studentId to set X-Forwarded-Prefix
            // This tells code-server the base path so redirects work correctly
            const url = req.originalUrl || req.url || '';
            const match = url.match(/\/workspace\/([a-zA-Z0-9-]+)/);
            const studentIdPart = match ? match[1] : null;

            if (studentIdPart) {
                proxyReq.setHeader('X-Forwarded-Prefix', `/api/proxy/workspace/${studentIdPart}`);
            }

            // Remove the base path prefix for code-server
            // code-server expects paths without the /api/proxy/workspace/:id prefix
            logger.debug('Proxy request', {
                originalUrl: url,
                method: req.method,
                headers: Object.keys(req.headers)
            });
        },
        proxyRes: (proxyRes: any, req: any, res: any) => {
            // Rewrite Location header for redirects to include the proxy prefix
            if (proxyRes.headers.location) {
                const url = req.originalUrl || req.url || '';
                const match = url.match(/\/workspace\/([a-zA-Z0-9-]+)/);
                const studentIdPart = match ? match[1] : null;

                if (studentIdPart) {
                    const originalLocation = proxyRes.headers.location;
                    let location = originalLocation;
                    const proxyPath = `/api/proxy/workspace/${studentIdPart}`;

                    // Handle absolute URLs pointing to internal IP
                    // Regex to match http(s)://10.x.x.x:8080/path or similar private IPs
                    const internalUrlRegex = /^https?:\/\/(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.|localhost|127\.)[^/]+(.*)/;
                    const internalMatch = location.match(internalUrlRegex);

                    if (internalMatch) {
                        // It's an internal absolute URL, extract just the path part
                        location = internalMatch[1] || '/';
                        logger.info('Detected internal absolute URL redirect', { original: originalLocation, extracted: location });
                    }

                    // If location is relative (starts with /), prepend the proxy path
                    if (location.startsWith('/')) {
                        proxyRes.headers.location = `${proxyPath}${location}`;
                        logger.info('Rewrote redirect location', {
                            original: originalLocation,
                            rewritten: proxyRes.headers.location
                        });
                    } else {
                        // If it's still an absolute URL that we didn't catch, log it
                        logger.warn('Unhandled absolute URL in Location header', { location: originalLocation });
                    }
                }
            }

            // Rewrite Set-Cookie header paths
            if (proxyRes.headers['set-cookie']) {
                const url = req.originalUrl || req.url || '';
                const match = url.match(/\/workspace\/([a-zA-Z0-9-]+)/);
                const studentIdPart = match ? match[1] : null;

                if (studentIdPart) {
                    const cookies = Array.isArray(proxyRes.headers['set-cookie'])
                        ? proxyRes.headers['set-cookie']
                        : [proxyRes.headers['set-cookie']];

                    proxyRes.headers['set-cookie'] = cookies.map((cookie: string) => {
                        // Rewrite Path=/ to Path=/api/proxy/workspace/:studentId/
                        return cookie.replace(/Path=\//gi, `Path=/api/proxy/workspace/${studentIdPart}/`);
                    });
                }
            }

            logger.debug('Proxy response', {
                statusCode: proxyRes.statusCode,
                headers: Object.keys(proxyRes.headers),
                location: proxyRes.headers.location
            });
        },
        error: (err: any, req: any, res: any) => {
            logger.error('Proxy error:', { error: err.message, url: req.url });
            if (!res.headersSent) {
                res.status(502).json({
                    error: 'Bad Gateway',
                    message: 'Unable to connect to workspace. Please ensure your workspace is running.'
                });
            }
        }
    }
});

// Middleware to verify workspace access before proxying
async function verifyAccess(req: Request, res: Response, next: NextFunction) {
    try {
        const { studentId } = req.params;

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' });
        }

        // Handle trailing slash redirect for root workspace path
        // This ensures relative redirects (like ./login) work correctly
        // Check if path ends with studentId (no trailing slash)
        const url = req.originalUrl.split('?')[0];
        if (url.endsWith(studentId)) {
            logger.info('Redirecting to add trailing slash', { from: req.originalUrl });
            return res.redirect(301, req.originalUrl.replace(studentId, studentId + '/'));
        }

        const hasAccess = await verifyWorkspaceAccess(req, studentId);
        if (!hasAccess) {
            return res.status(403).json({
                error: 'Workspace not accessible',
                message: 'Workspace is not running or does not exist. Please start your workspace first.'
            });
        }

        next();
    } catch (error) {
        logger.error('Access verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Mount proxy WITHOUT authentication requirement
// code-server will handle its own password authentication
router.use('/workspace/:studentId', verifyAccess, workspaceProxy);

export default router;
