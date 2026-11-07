import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'An unexpected internal server error occurred';
  let details: unknown = undefined;

  // Handle known AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  }
  // Handle Zod Validation Error
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }
  // Handle Mongoose CastError (e.g., invalid ObjectId)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for parameter: ${err.path}`;
    details = { path: err.path, value: err.value };
  }
  // Handle Mongoose ValidationError
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Database validation error';
    details = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
  }
  // Handle MongoDB Duplicate Key Error (code 11000)
  else if ((err as { code?: number }).code === 11000) {
    statusCode = 409;
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    message = keyValue
      ? `A resource with ${Object.keys(keyValue).join(', ')} already exists`
      : 'Duplicate resource error';
    details = keyValue;
  }
  // Handle JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  // Log error with level based on status
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${err.message}`, {
      stack: err.stack,
      details,
    });
  } else {
    logger.warn(`[${statusCode}] ${err.message}`, details);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined && { details }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
