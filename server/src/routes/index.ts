import { Router } from 'express';
import { healthRoutes } from './health.routes.js';
import { authRoutes } from './auth.routes.js';
import { taskRoutes } from './task.routes.js';
import { dashboardRoutes } from './dashboard.routes.js';

const apiRouter = Router();

// Mount modules
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/tasks', taskRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

export { apiRouter };
