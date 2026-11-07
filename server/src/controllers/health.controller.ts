import type { Request, Response } from 'express';
import { HealthService } from '../services/health.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const healthData = HealthService.getHealth();
  return ApiResponse.success(res, healthData, 'System health check completed successfully');
});
