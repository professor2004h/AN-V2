import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { workspaceService } from '../services/workspaceService';
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

// Delete workspace (with access control)
router.delete('/:studentId', async (req: AuthRequest, res, next) => {
  try {
    const { studentId } = req.params;

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
