import type { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required');
  }

  const stats = await DashboardService.getStats(req.user.id);
  return ApiResponse.success(res, { stats }, 'Dashboard statistics retrieved successfully');
});
