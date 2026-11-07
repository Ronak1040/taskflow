import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { setAuthCookie, clearAuthCookie } from '../utils/auth.utils.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await AuthService.register(req.body);

  // Set secure HTTP-only cookie
  setAuthCookie(res, token);

  return ApiResponse.created(
    res,
    { user },
    'User registered successfully'
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await AuthService.login(req.body);

  // Set secure HTTP-only cookie
  setAuthCookie(res, token);

  return ApiResponse.success(
    res,
    { user },
    'Login successful'
  );
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // Clear HTTP-only cookie
  clearAuthCookie(res);

  return ApiResponse.success(
    res,
    null,
    'Logout successful'
  );
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw AppError.unauthorized('Not authenticated');
  }

  const user = await AuthService.getMe(req.user.id);

  return ApiResponse.success(
    res,
    { user },
    'User profile retrieved successfully'
  );
});
