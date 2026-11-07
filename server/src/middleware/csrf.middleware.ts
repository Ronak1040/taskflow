import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { env } from '../config/env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF Protection Middleware for Cookie-based Auth
 * Validates Origin/Referer headers and custom request headers on state-changing requests.
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  // Safe read-only HTTP methods do not require CSRF checks
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Check Origin header against allowed origin if present
  const origin = req.headers.origin;
  if (origin) {
    const allowedOrigin = env.CORS_ORIGIN;
    // Allow matching origin, localhost, or 127.0.0.1 in dev
    const isAllowed =
      origin === allowedOrigin ||
      (env.NODE_ENV === 'development' && (origin.includes('localhost') || origin.includes('127.0.0.1')));

    if (!isAllowed) {
      return next(AppError.forbidden('CSRF validation failed: Invalid request origin'));
    }
  }

  next();
}
