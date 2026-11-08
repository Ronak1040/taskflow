import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { healthRoutes } from './routes/health.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { taskRoutes } from './routes/task.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { csrfProtection } from './middleware/csrf.middleware.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';

export function createApp(): Application {
  const app = express();

  // Security HTTP headers
  app.use(helmet());

  // CORS configuration with credentials support for HTTP-only cookies
  const allowedOrigins = [
    env.CORS_ORIGIN,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., mobile apps, test runners)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Cookie parser for reading HTTP-only auth cookies
  app.use(cookieParser(env.COOKIE_SECRET));

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Custom structured HTTP request logging
  app.use(requestLogger);

  // CSRF protection for cookie-based authentication
  app.use(csrfProtection);

  // Health check routes
  app.use('/health', healthRoutes);

  // Rate limiting across all REST API endpoints
  app.use('/api', apiLimiter);

  // Standard API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Versioned API routes: /api/v1/*
  app.use('/api/v1', apiRouter);

  // Unhandled routes -> 404
  app.use(notFoundHandler);

  // Centralized error handling
  app.use(errorHandler);

  return app;
}
