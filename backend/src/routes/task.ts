import { Router } from 'express';
import { authenticate, AuthRequest, requireTrainer } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';
import { validateBody } from '../middleware/validation';
import { notificationService } from '../services/notificationService';
import { logger } from '../lib/logger';

const router = Router();

router.use(authenticate);

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  studentId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional(),
});

// Get tasks (filtered by role)
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, priority } = req.query;

    let query = supabaseAdmin
      .from('tasks')
      .select(`
        *,
        student:students(*, profile:profiles(*)),
        trainer:profiles!tasks_trainer_id_fkey(*),
        project:projects(*)
      `)
      .order('created_at', { ascending: false });

    // Filter based on role
    if (req.user!.role === 'student') {
      // Students see only their tasks
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', req.user!.id)
        .single();

      if (student) {
        query = query.eq('student_id', student.id);
      }
    } else if (req.user!.role === 'trainer') {
      // Trainers see tasks they created
      query = query.eq('trainer_id', req.user!.id);
    }
    // Admins and superadmins see all tasks

    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Create task (trainers only)
router.post('/', requireTrainer, validateBody(createTaskSchema), async (req: AuthRequest, res, next) => {
  try {
    const { title, description, studentId, projectId, priority, dueDate } = req.body;

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        title,
        description,
        student_id: studentId,
        trainer_id: req.user!.id,
        project_id: projectId,
        priority,
        due_date: dueDate,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Get student user_id for notification (don't fail if this errors)
    try {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('user_id')
        .eq('id', studentId)
        .single();

      if (student) {
        // Send notification to student
        await notificationService.notifyTaskAssigned(student.user_id, title, dueDate);
      }
    } catch (notifError) {
      // Log but don't fail the request
      logger.error('Failed to send task notification', { error: notifError });
    }

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Update task status
router.patch('/:id/status', async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;

    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;

