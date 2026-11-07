import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';

const router = Router();

// GET /api/v1/health & GET /health
router.get('/', getHealth);

export const healthRoutes = router;
