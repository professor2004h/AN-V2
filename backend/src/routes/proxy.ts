
import { Router, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { workspaceService } from '../services/workspaceService';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import * as zlib from 'zlib';

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

// Router function to get target URL - shared between proxies
async function getProxyTarget(req: any): Promise<string | undefined> {
    try {
        // Extract studentId from URL - use originalUrl for Express requests, url for raw upgrade requests
        const url = req.originalUrl || req.url || '';
        logger.info('getProxyTarget called', { originalUrl: req.originalUrl, url: req.url, finalUrl: url });

        // Match both /api/proxy/workspace/:id and /workspace/:id patterns
        const match = url.match(/\/(?:api\/proxy\/)?workspace\/([a-zA-Z0-9-]+)/);
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
}

// Path rewrite function - shared between proxies
function rewritePath(path: string, req: any): string {
    // Strip /api/proxy/workspace/:studentId prefix (for server-level upgrade requests)
    // or /workspace/:studentId prefix (for Express middleware requests)
    let rewritten = path.replace(/^\/api\/proxy\/workspace\/[a-zA-Z0-9-]+/, '');
    if (rewritten === path) {
        // Try the Express-style path if first pattern didn't match
        rewritten = path.replace(/^\/workspace\/[a-zA-Z0-9-]+/, '');
    }
    const finalPath = rewritten || '/';
    logger.debug('Path rewrite', { original: path, rewritten: finalPath });
    return finalPath;
}

// WebSocket proxy - no selfHandleResponse needed
const wsProxy = createProxyMiddleware({
    target: 'http://localhost:8080',
    changeOrigin: true,
    ws: true,
    router: getProxyTarget,
    pathRewrite: rewritePath,
    on: {
        proxyReq: (proxyReq: any, req: any, res: any) => {
            // Extract studentId to set X-Forwarded-Prefix
            const url = req.originalUrl || req.url || '';
            const match = url.match(/\/workspace\/([a-zA-Z0-9-]+)/);
            const studentIdPart = match ? match[1] : null;

            if (studentIdPart) {
                const proxyPath = `/api/proxy/workspace/${studentIdPart}`;
                proxyReq.setHeader('X-Forwarded-Prefix', proxyPath);
                proxyReq.setHeader('X-Forwarded-Proto', 'https');
                proxyReq.setHeader('X-Base-Path', proxyPath);
            }
        },
        error: (err: any, req: any, res: any) => {
            logger.error('WebSocket proxy error:', { error: err.message, url: req.url });
        }
    }
});

// HTTP proxy - with selfHandleResponse to rewrite HTML
const workspaceProxy = createProxyMiddleware({
    target: 'http://localhost:8080',
    changeOrigin: true,
    ws: false, // HTTP only - WebSocket handled by wsProxy
    selfHandleResponse: true, // Handle response manually to rewrite HTML
    router: getProxyTarget,
    pathRewrite: rewritePath,
    on: {
        proxyReq: (proxyReq: any, req: any, res: any) => {
            // Extract studentId to set X-Forwarded-Prefix
            const url = req.originalUrl || req.url || '';
            const match = url.match(/\/workspace\/([a-zA-Z0-9-]+)/);
            const studentIdPart = match ? match[1] : null;

            if (studentIdPart) {
                const proxyPath = `/api/proxy/workspace/${studentIdPart}`;
                proxyReq.setHeader('X-Forwarded-Prefix', proxyPath);

                // Add other helpful headers
                proxyReq.setHeader('X-Forwarded-Proto', 'https');
                proxyReq.setHeader('X-Base-Path', proxyPath);
            }
        },
        proxyRes: (proxyRes: any, req: any, res: any) => {
            const url = req.originalUrl || req.url || '';
            const match = url.match(/\/workspace\/([a-zA-Z0-9-]+)/);
            const studentIdPart = match ? match[1] : null;
            const proxyPath = studentIdPart ? `/api/proxy/workspace/${studentIdPart}` : '';

            // Handle redirects (Location header)
            if (proxyRes.headers.location && studentIdPart) {
                let location = proxyRes.headers.location;

                // Handle absolute URLs pointing to internal IP
                const internalUrlRegex = /^https?:\/\/(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.|localhost|127\.)[^/]+(.*)/;
                const internalMatch = location.match(internalUrlRegex);

                if (internalMatch) {
                    location = internalMatch[1] || '/';
                }

                if (location.startsWith('/')) {
                    proxyRes.headers.location = `${proxyPath}${location}`;
                }
            }

            // Handle Cookies (Set-Cookie header)
            if (proxyRes.headers['set-cookie'] && studentIdPart) {
                const cookies = Array.isArray(proxyRes.headers['set-cookie'])
                    ? proxyRes.headers['set-cookie']
                    : [proxyRes.headers['set-cookie']];

                proxyRes.headers['set-cookie'] = cookies.map((cookie: string) => {
                    let modifiedCookie = cookie;

                    // Extract current path from cookie
                    const pathMatch = cookie.match(/Path=([^;]+)/i);
                    const currentPath = pathMatch ? pathMatch[1] : '/';

                    // Only rewrite if path is exactly "/" (root path)
                    // Don't rewrite if code-server already set a specific path (from href field)
                    if (currentPath === '/') {
                        // Replace Path=/ with Path={proxyPath}/
                        modifiedCookie = cookie.replace(/Path=\/(?=;|$)/i, `Path=${proxyPath}/`);
                    }

                    // Add Secure attribute for HTTPS and change SameSite to None for cross-origin
                    if (!modifiedCookie.includes('Secure')) {
                        modifiedCookie = modifiedCookie.replace(/SameSite=Lax/gi, 'SameSite=None; Secure');
                    }
                    // If no SameSite at all, add it with Secure
                    if (!modifiedCookie.includes('SameSite')) {
                        modifiedCookie = modifiedCookie + '; SameSite=None; Secure';
                    }
                    return modifiedCookie;
                });
            }

            // Check if response is HTML
            const contentType = proxyRes.headers['content-type'] || '';
            const isHtml = contentType.includes('text/html');
            const contentEncoding = proxyRes.headers['content-encoding'] || '';

            // Copy status code
            res.status(proxyRes.statusCode);

            // Copy headers (but remove content-encoding since we'll decompress, and remove CSP to allow inline scripts)
            Object.keys(proxyRes.headers).forEach((key: string) => {
                const lowerKey = key.toLowerCase();
                if (lowerKey !== 'content-length' &&
                    lowerKey !== 'transfer-encoding' &&
                    lowerKey !== 'content-encoding' &&
                    lowerKey !== 'content-security-policy' &&
                    lowerKey !== 'content-security-policy-report-only') {
                    res.setHeader(key, proxyRes.headers[key]);
                }
            });

            // If not HTML or no student ID, pipe directly (but handle compression)
            if (!isHtml || !studentIdPart) {
                // For non-HTML, just pipe through with original encoding
                if (contentEncoding) {
                    res.setHeader('content-encoding', contentEncoding);
                }
                proxyRes.pipe(res);
                return;
            }

            // If HTML, buffer and rewrite (decompress if needed)
            let body = Buffer.from([]);

            proxyRes.on('data', (chunk: Buffer) => {
                body = Buffer.concat([body, chunk]);
            });

            proxyRes.on('end', () => {
                try {
                    // Decompress if needed
                    let decompressedBody: Buffer;
                    if (contentEncoding === 'gzip') {
                        decompressedBody = zlib.gunzipSync(body);
                    } else if (contentEncoding === 'deflate') {
                        decompressedBody = zlib.inflateSync(body);
                    } else if (contentEncoding === 'br') {
                        decompressedBody = zlib.brotliDecompressSync(body);
                    } else {
                        decompressedBody = body;
                    }

                    let bodyStr = decompressedBody.toString('utf8');

                    // Rewrite JavaScript redirects
                    const rewrittenBody = bodyStr
                        .replace(/window\.location\s*=\s*["']\/["']/g, `window.location="${proxyPath}/"`)
                        .replace(/window\.location\.href\s*=\s*["']\/["']/g, `window.location.href="${proxyPath}/"`)
                        .replace(/location\.replace\s*\(\s*["']\/["']\s*\)/g, `location.replace("${proxyPath}/")`)
                        .replace(/location\.href\s*=\s*["']\/["']/g, `location.href="${proxyPath}/"`)
                        .replace(/<meta\s+http-equiv=["']refresh["']\s+content=["']([^"']*)url=\/["']/gi, `<meta http-equiv="refresh" content="$1url=${proxyPath}/"`)
                        .replace(/<base\s+href=["']\/["']/gi, `<base href="${proxyPath}/"`)
                        .replace(/"\/login"/g, `"${proxyPath}/login"`)
                        .replace(/'\/login'/g, `'${proxyPath}/login'`);

                    // Send uncompressed response (ALB will compress if needed)
                    res.setHeader('content-length', Buffer.byteLength(rewrittenBody));
                    res.send(rewrittenBody);

                    logger.debug('Rewrote HTML response', {
                        studentId: studentIdPart,
                        originalLength: bodyStr.length,
                        newLength: rewrittenBody.length,
                        wasCompressed: !!contentEncoding
                    });
                } catch (e) {
                    logger.error('Error rewriting HTML response', e);
                    // If decompression fails, try to send original
                    if (contentEncoding) {
                        res.setHeader('content-encoding', contentEncoding);
                    }
                    res.send(body);
                }
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

// Middleware to route WebSocket vs HTTP requests
function proxyMiddleware(req: Request, res: Response, next: NextFunction) {
    // Check if this is a WebSocket upgrade request
    const upgrade = req.headers['upgrade'];
    if (upgrade && upgrade.toLowerCase() === 'websocket') {
        // Use WebSocket proxy (no selfHandleResponse)
        return wsProxy(req, res, next);
    }
    // Use HTTP proxy (with selfHandleResponse for HTML rewriting)
    return workspaceProxy(req, res, next);
}

// Mount proxy WITHOUT authentication requirement
// code-server will handle its own password authentication
router.use('/workspace/:studentId', verifyAccess, proxyMiddleware);

// Export the wsProxy for server-level WebSocket upgrade handling
export { wsProxy };
export default router;
