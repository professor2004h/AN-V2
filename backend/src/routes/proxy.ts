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
async function verifyWorkspaceAccess(studentId: string): Promise<boolean> {
    try {
        const { data, error } = await supabaseAdmin
            .from('students')
            .select('workspace_status, workspace_task_arn')
            .eq('id', studentId)
            .single();

        if (error || !data) {
            logger.warn('Student not found for workspace access', { studentId });
            return false;
        }

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
            // Extract studentId from URL
            const url = req.url || '';
            const pathParts = url.split('/');
            // URL: /workspace/:studentId/...
            // pathParts: ['', 'workspace', ':studentId', ...]
            const studentIdPart = pathParts[1];

            if (!studentIdPart) {
                logger.error('No studentId in proxy path', { url });
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
            // Remove the base path prefix for code-server
            // code-server expects paths without the /api/proxy/workspace/:id prefix
            const url = req.originalUrl || req.url || '';
            logger.debug('Proxy request', {
                originalUrl: url,
                method: req.method,
                headers: Object.keys(req.headers)
            });
        },
        proxyRes: (proxyRes: any, req: any, res: any) => {
            logger.debug('Proxy response', {
                statusCode: proxyRes.statusCode,
                headers: Object.keys(proxyRes.headers)
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

        const hasAccess = await verifyWorkspaceAccess(studentId);
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
