import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// Analytics routes will be implemented here

export default router;

