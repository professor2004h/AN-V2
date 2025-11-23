import { Router } from 'express';
import { authenticate, AuthRequest, requireStudent } from '../middleware/auth';
import { studentService } from '../services/studentService';
import { logger } from '../lib/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current student profile
router.get('/me', async (req: AuthRequest, res, next) => {
  try {
    const student = await studentService.getStudentByUserId(req.user!.id);
    res.json(student);
  } catch (error) {
    next(error);
  }
});

// Get student projects
router.get('/me/projects', async (req: AuthRequest, res, next) => {
  try {
    const student = await studentService.getStudentByUserId(req.user!.id);
    const projects = await studentService.getStudentProjects(student.id);
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// Get current project
router.get('/me/current-project', async (req: AuthRequest, res, next) => {
  try {
    const student = await studentService.getStudentByUserId(req.user!.id);
    const currentProject = await studentService.getCurrentProject(student.id);
    res.json(currentProject);
  } catch (error) {
    next(error);
  }
});

// Get student tasks
router.get('/me/tasks', async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.query;
    const student = await studentService.getStudentByUserId(req.user!.id);
    const tasks = await studentService.getStudentTasks(
      student.id,
      status as string | undefined
    );
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Get student by ID (for trainers/admins)
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    res.json(student);
  } catch (error) {
    next(error);
  }
});

// Get student projects by ID (for trainers/admins)
router.get('/:id/projects', async (req: AuthRequest, res, next) => {
  try {
    const projects = await studentService.getStudentProjects(req.params.id);
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// Get student tasks by ID (for trainers/admins)
router.get('/:id/tasks', async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.query;
    const tasks = await studentService.getStudentTasks(
      req.params.id,
      status as string | undefined
    );
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

export default router;

