import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

export const dashboardRoutes = router;
