import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { adminService } from '../services/adminService';
import { z } from 'zod';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// ==================== TRAINER MANAGEMENT ====================

router.get('/trainers', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const result = await adminService.getAllTrainers(page, limit, search);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/trainers', async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      fullName: z.string().min(1),
      specialization: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const trainer = await adminService.createTrainer(data);
    res.status(201).json(trainer);
  } catch (error) {
    next(error);
  }
});

router.patch('/trainers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const trainer = await adminService.updateTrainer(id, req.body);
    res.json(trainer);
  } catch (error) {
    next(error);
  }
});

router.delete('/trainers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.deleteTrainer(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ==================== STUDENT MANAGEMENT ====================

router.get('/students', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      search: req.query.search as string,
      track: req.query.track as string,
      batchId: req.query.batchId as string,
      trainerId: req.query.trainerId as string,
    };

    const result = await adminService.getAllStudents(page, limit, filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/students', async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      fullName: z.string().min(1),
      track: z.enum(['data_professional', 'full_stack_dev']),
      batchId: z.string().uuid().nullable().optional(),
      trainerId: z.string().uuid().nullable().optional(),
    });

    const data = schema.parse(req.body);
    const student = await adminService.createStudent(data);
    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
});

router.patch('/students/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await adminService.updateStudent(id, req.body);
    res.json(student);
  } catch (error) {
    next(error);
  }
});

router.post('/students/:id/assign-trainer', async (req, res, next) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      trainerId: z.string().uuid(),
    });

    const { trainerId } = schema.parse(req.body);
    const student = await adminService.assignStudentToTrainer(id, trainerId);
    res.json(student);
  } catch (error) {
    next(error);
  }
});

// ==================== BATCH MANAGEMENT ====================

router.get('/batches', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await adminService.getAllBatches(page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/batches', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string(),
      track: z.enum(['data_professional', 'full_stack_dev']),
      startDate: z.string(),
      endDate: z.string().optional(),
      maxStudents: z.number().optional(),
    });

    const data = schema.parse(req.body);
    const batch = await adminService.createBatch(data);
    res.status(201).json(batch);
  } catch (error) {
    next(error);
  }
});

router.patch('/batches/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const batch = await adminService.updateBatch(id, req.body);
    res.json(batch);
  } catch (error) {
    next(error);
  }
});

// ==================== PROJECT MANAGEMENT ====================

router.get('/projects', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await adminService.getAllProjects(page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/projects', async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string(),
      description: z.string(),
      track: z.enum(['data_professional', 'full_stack_dev']),
      orderIndex: z.number(),
      requirements: z.any().optional(),
      techStack: z.array(z.string()).optional(),
    });

    const data = schema.parse(req.body);
    const project = await adminService.createProject(data);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

router.patch('/projects/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await adminService.updateProject(id, req.body);
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// ==================== SYSTEM STATISTICS ====================

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await adminService.getSystemStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;

