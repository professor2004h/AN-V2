import { Router } from 'express';
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

// Proxy middleware
const workspaceProxy = createProxyMiddleware({
    target: 'http://localhost:8080', // Placeholder, will be overwritten by router
    changeOrigin: true,
    ws: true, // Enable WebSocket support
    router: async (req) => {
        try {
            // Extract studentId from path: /api/proxy/workspace/:studentId/...
            const pathParts = req.path.split('/');
            // req.path is relative to where router is mounted.
            // If mounted at /api/proxy, req.path starts with /workspace/:studentId
            // pathParts[0] = empty, pathParts[1] = workspace, pathParts[2] = studentId

            const studentId = pathParts[2];
            if (!studentId) return undefined;

            // Get IP
            const ip = await workspaceService.getWorkspaceIp(studentId);
            if (!ip) {
                console.error(`No IP found for workspace ${studentId}`);
                return undefined;
            }

            return `http://${ip}:8080`;
        } catch (error) {
            console.error('Proxy router error:', error);
            return undefined;
        }
    },
    pathRewrite: (path, req) => {
        // Strip /api/proxy/workspace/:studentId
        // Path comes in as /api/proxy/workspace/:studentId/foo
        // We want /foo

        // Regex to match /api/proxy/workspace/UUID
        return path.replace(/^\/api\/proxy\/workspace\/[a-zA-Z0-9-]+/, '');
    },
    onProxyReq: (proxyReq: any, req: any, res: any) => {
        // Set X-Forwarded-Prefix so code-server knows its base path
        // The base path is /api/proxy/workspace/:studentId
        const pathParts = req.originalUrl.split('/');
        // originalUrl is full path: /api/proxy/workspace/:studentId/foo
        // We want /api/proxy/workspace/:studentId
        const studentId = pathParts[4]; // /api/proxy/workspace/:studentId

        // Construct prefix carefully
        // originalUrl: /api/proxy/workspace/123/login
        // prefix: /api/proxy/workspace/123

        // Find index of 'workspace'
        const workspaceIndex = pathParts.indexOf('workspace');
        if (workspaceIndex !== -1 && pathParts[workspaceIndex + 1]) {
            const prefix = pathParts.slice(0, workspaceIndex + 2).join('/');
            proxyReq.setHeader('X-Forwarded-Prefix', prefix);
        }

        // Pass auth token if needed? No, code-server uses password.
    },
    onError: (err: any, req: any, res: any) => {
        console.error('Proxy error:', err);
        res.status(502).send('Bad Gateway: Unable to connect to workspace');
    }
});

// Mount proxy
// We need to handle authentication before proxying
// But http-proxy-middleware handles the request, so we need a wrapper or use it as a handler
// Also, we need to handle Upgrade requests for WebSockets

// We can't use `router.use` with `authenticate` easily because `authenticate` consumes the body?
// No, `authenticate` just checks headers.

router.use('/workspace/:studentId', authenticate, async (req: AuthRequest, res, next) => {
    const { studentId } = req.params;

    try {
        const hasAccess = await verifyStudentAccess(req, studentId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // If access granted, continue to proxy
        // But we need to make sure we don't consume the stream if it's a POST/PUT
        // `authenticate` middleware doesn't consume stream.

        // However, `express.json()` middleware GLOBAL in index.ts MIGHT consume the stream!
        // This is a common issue.
        // We need to ensure this route is mounted BEFORE body parsers, or disable body parsing for this route.

        next();
    } catch (error) {
        next(error);
    }
}, workspaceProxy);

export default router;
