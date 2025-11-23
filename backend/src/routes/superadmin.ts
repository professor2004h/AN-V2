import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { superadminService } from '../services/superadminService';
import { z } from 'zod';

const router = Router();

router.use(authenticate);
router.use(requireSuperAdmin);

// ==================== REVENUE STATISTICS ====================

router.get('/revenue', async (req, res, next) => {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const stats = await superadminService.getRevenueStats(startDate, endDate);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// ==================== PAYMENT MANAGEMENT ====================

router.get('/payments', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      status: req.query.status as string,
      track: req.query.track as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      search: req.query.search as string,
    };

    const result = await superadminService.getAllPayments(page, limit, filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/payments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await superadminService.getPaymentById(id);
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

router.get('/payments/export/:format', async (req, res, next) => {
  try {
    const format = req.params.format as 'csv' | 'pdf';
    const filters = {
      status: req.query.status as string,
      track: req.query.track as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const data = await superadminService.exportPayments(format, filters);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=payments.pdf');
    }

    res.send(data);
  } catch (error) {
    next(error);
  }
});

// ==================== FINANCIAL ANALYTICS ====================

router.get('/financial-analytics', async (req, res, next) => {
  try {
    const analytics = await superadminService.getFinancialAnalytics();
    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

// ==================== ADMIN MANAGEMENT ====================

router.post('/admins', async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      fullName: z.string().min(1),
    });

    const data = schema.parse(req.body);
    const admin = await superadminService.createAdmin(data);
    res.status(201).json(admin);
  } catch (error) {
    next(error);
  }
});

router.delete('/admins/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await superadminService.deleteAdmin(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

