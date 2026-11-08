import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { env } from '../config/env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF Protection Middleware for Cookie-based Auth
 * Validates Origin and Referer headers on state-changing requests.
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  // Safe read-only HTTP methods do not require CSRF checks
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Derive source from Origin or Referer header
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  let source = origin;

  if (!source && referer) {
    try {
      source = new URL(referer).origin;
    } catch {
      return next(AppError.forbidden('CSRF validation failed: Malformed request referer'));
    }
  }

  if (source) {
    const allowedOrigin = env.CORS_ORIGIN;
    const isAllowed =
      source === allowedOrigin ||
      (env.NODE_ENV === 'development' && (source.includes('localhost') || source.includes('127.0.0.1')));

    if (!isAllowed) {
      return next(AppError.forbidden('CSRF validation failed: Invalid request origin'));
    }
  }

  next();
}
