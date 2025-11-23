import { Router } from 'express';
import { authenticate, AuthRequest, requireTrainer } from '../middleware/auth';
import { trainerService } from '../services/trainerService';
import { z } from 'zod';
import { validateBody } from '../middleware/validation';

const router = Router();

router.use(authenticate);
router.use(requireTrainer);

// Get trainer's students
router.get('/me/students', async (req: AuthRequest, res, next) => {
  try {
    const filters = {
      search: req.query.search as string,
      track: req.query.track as string,
      status: req.query.status as string,
    };
    const students = await trainerService.getTrainerStudents(req.user!.id, filters);
    res.json(students);
  } catch (error) {
    next(error);
  }
});

// Get student detail
router.get('/students/:id', async (req: AuthRequest, res, next) => {
  try {
    const student = await trainerService.getStudentDetail(req.user!.id, req.params.id);
    res.json(student);
  } catch (error) {
    next(error);
  }
});

// Get pending submissions
router.get('/submissions/pending', async (req: AuthRequest, res, next) => {
  try {
    const submissions = await trainerService.getPendingSubmissions(req.user!.id);
    res.json(submissions);
  } catch (error) {
    next(error);
  }
});

// Review submission
const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'needs_revision']),
  feedback: z.string().min(10),
  grade: z.number().min(0).max(100).optional(),
});

router.post('/submissions/:id/review', validateBody(reviewSchema), async (req: AuthRequest, res, next) => {
  try {
    const submission = await trainerService.reviewSubmission(
      req.user!.id,
      req.params.id,
      req.body
    );
    res.json(submission);
  } catch (error) {
    next(error);
  }
});

// Get trainer stats
router.get('/me/stats', async (req: AuthRequest, res, next) => {
  try {
    const students = await trainerService.getTrainerStudents(req.user!.id);

    const stats = {
      totalStudents: students.length,
      activeStudents: students.filter(s =>
        s.student_projects?.some((sp: any) => sp.status === 'in_progress')
      ).length,
      completedProjects: students.reduce((acc, s) =>
        acc + (s.student_projects?.filter((sp: any) => sp.status === 'approved').length || 0), 0
      ),
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;

