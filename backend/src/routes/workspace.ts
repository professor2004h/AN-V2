import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { workspaceServiceAWS as workspaceService } from '../services/workspaceServiceAWS';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

router.use(authenticate);

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
  // Trainers, admins, and superadmins can access any student's workspace
  return ['trainer', 'admin', 'superadmin'].includes(req.user!.role);
}

// ==================== WORKSPACE MANAGEMENT ====================

// Provision workspace (students provision their own, admins can provision for any student)
router.post('/provision', async (req: AuthRequest, res, next) => {
  try {
    let studentId = req.body.studentId;

    // If student role, use their own ID
    if (req.user!.role === 'student') {
      studentId = await getStudentId(req.user!.id);
    }

    const workspace = await workspaceService.provisionWorkspace(studentId);
    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
});

// Provision workspace with real-time progress (SSE)
router.get('/provision-stream', async (req: AuthRequest, res, next) => {
  try {
    let studentId = req.query.studentId as string;

    // If student role, use their own ID
    if (req.user!.role === 'student') {
      studentId = await getStudentId(req.user!.id);
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Progress callback
    const onProgress = (message: string, progress: number) => {
      res.write(`data: ${JSON.stringify({ message, progress })}\n\n`);
    };

    // Provision with progress updates
    const workspace = await workspaceService.provisionWorkspace(studentId, onProgress);

    // Send final success message
    res.write(`data: ${JSON.stringify({ message: 'Complete', progress: 100, workspace })}\n\n`);
    res.end();
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ error: error.message, progress: 0 })}\n\n`);
    res.end();
  }
});

// Get workspace (with access control)
router.get('/:studentId', async (req: AuthRequest, res, next) => {
  try {
    const { studentId } = req.params;

    const hasAccess = await verifyStudentAccess(req, studentId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const workspace = await workspaceService.getWorkspaceByStudentId(studentId);
    res.json(workspace);
  } catch (error) {
    next(error);
  }
});

// Start workspace (with access control)
router.post('/:studentId/start', async (req: AuthRequest, res, next) => {
  try {
    const { studentId } = req.params;

    const hasAccess = await verifyStudentAccess(req, studentId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const workspace = await workspaceService.startWorkspace(studentId);
    res.json(workspace);
  } catch (error) {
    next(error);
  }
});

// Stop workspace (with access control)
router.post('/:studentId/stop', async (req: AuthRequest, res, next) => {
  try {
    const { studentId } = req.params;

    const hasAccess = await verifyStudentAccess(req, studentId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const workspace = await workspaceService.stopWorkspace(studentId);
    res.json(workspace);
  } catch (error) {
    next(error);
  }
});

// Delete workspace (ADMIN/TRAINER ONLY - students cannot delete)
router.delete('/:studentId', async (req: AuthRequest, res, next) => {
  try {
    const { studentId } = req.params;

    // Only admins and trainers can delete workspaces
    if (req.user!.role === 'student') {
      return res.status(403).json({ error: 'Students cannot delete workspaces. Please contact your trainer or admin.' });
    }

    const hasAccess = await verifyStudentAccess(req, studentId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await workspaceService.deleteWorkspace(studentId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Heartbeat endpoint to keep workspace alive
router.post('/heartbeat', async (req: AuthRequest, res, next) => {
  try {
    let studentId = req.body.studentId;

    // If student role, use their own ID
    if (req.user!.role === 'student') {
      studentId = await getStudentId(req.user!.id);
    }

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID required' });
    }

    await workspaceService.updateActivity(studentId);
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});

export default router;
