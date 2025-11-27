import { Router, Request } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticate, AuthRequest } from '../middleware/auth';
import { workspaceService } from '../services/workspaceService';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Helper to get student ID from user
async function getStudentId(userId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (error || !data) throw new Error('Student not found');
    return data.id;
}

// Helper to verify student access
async function verifyStudentAccess(req: AuthRequest, studentId: string): Promise<boolean> {
    if (req.user!.role === 'student') {
        const userStudentId = await getStudentId(req.user!.id);
        return userStudentId === studentId;
    }
    return ['trainer', 'admin', 'superadmin'].includes(req.user!.role);
}

// Helper to get workspace IP
async function getWorkspaceIp(studentId: string): Promise<string | null> {
    // Type assertion since we know we're using Fargate in production
    const service = workspaceService as any;
    if (typeof service.getWorkspaceIp === 'function') {
        return await service.getWorkspaceIp(studentId);
    }
    return null;
}

// Proxy middleware
const workspaceProxy = createProxyMiddleware({
    target: 'http://localhost:8080',
    changeOrigin: true,
    ws: true,
    router: async (req: Request) => {
        try {
            // Extract studentId from URL
            const url = req.url || '';
            const pathParts = url.split('/');
            // URL: /workspace/:studentId/...
            // pathParts: ['', 'workspace', ':studentId', ...]
            const studentId = pathParts[2];

            if (!studentId) {
                console.error('No studentId in path');
                return undefined;
            }

            const ip = await getWorkspaceIp(studentId);
            if (!ip) {
                console.error(`No IP found for workspace ${studentId}`);
                return undefined;
            }

            console.log(`Proxying to workspace ${studentId} at ${ip}:8080`);
            return `http://${ip}:8080`;
        } catch (error) {
            console.error('Proxy router error:', error);
            return undefined;
        }
    },
    pathRewrite: (path: string) => {
        // Strip /workspace/:studentId prefix
        // Input: /workspace/abc-123/some/path
        // Output: /some/path
        const rewritten = path.replace(/^\/workspace\/[a-zA-Z0-9-]+/, '');
        return rewritten || '/';
    },
    on: {
        proxyReq: (proxyReq, req: any) => {
            // Set X-Forwarded-Prefix for code-server
            const url = req.originalUrl || req.url || '';
            const match = url.match(/^(\/api\/proxy\/workspace\/[a-zA-Z0-9-]+)/);
            if (match) {
                proxyReq.setHeader('X-Forwarded-Prefix', match[1]);
            }
        },
        error: (err, req, res: any) => {
            console.error('Proxy error:', err);
            if (!res.headersSent) {
                res.status(502).send('Bad Gateway: Unable to connect to workspace');
            }
        }
    }
});

// Mount proxy with authentication
router.use('/workspace/:studentId', authenticate, async (req: AuthRequest, res, next) => {
    const { studentId } = req.params;

    try {
        const hasAccess = await verifyStudentAccess(req, studentId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        next();
    } catch (error) {
        next(error);
    }
}, workspaceProxy);

export default router;
