import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { verifyToken } from '../utils/auth.utils.js';
import { User } from '../models/user.model.js';
import type { AuthenticatedUser } from '../types/index.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Extract token from HTTP-only cookie, with fallback to Bearer header
    let token = req.cookies?.[env.TOKEN_NAME];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(AppError.unauthorized('Authentication required. Please log in.'));
    }

    // 2. Verify token signature and expiration
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return next(AppError.unauthorized('Session has expired. Please log in again.'));
      }
      return next(AppError.unauthorized('Invalid authentication token.'));
    }

    // 3. Retrieve authenticated user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return next(AppError.unauthorized('The user belonging to this token no longer exists.'));
    }

    if (!user.isActive) {
      return next(AppError.unauthorized('This user account has been deactivated.'));
    }

    // 4. Attach authenticated user information to request
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as AuthenticatedUser;

    next();
  } catch (error) {
    next(error);
  }
}
