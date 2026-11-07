import { Router } from 'express';
import { healthRoutes } from './health.routes.js';
import { authRoutes } from './auth.routes.js';

const apiRouter = Router();

// Mount modules
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);

export { apiRouter };
