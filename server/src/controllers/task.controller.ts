import type { Request, Response } from 'express';
import { TaskService } from '../services/task.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import type { TaskStatus } from '../types/index.js';

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required');
  }

  const task = await TaskService.createTask(req.user.id, req.body);
  return ApiResponse.created(res, { task }, 'Task created successfully');
});

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required');
  }

  const result = await TaskService.getTasks(req.user.id, req.query as any);
  return ApiResponse.success(res, { tasks: result.tasks }, 'Tasks retrieved successfully', 200, result.meta);
});

export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required');
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const task = await TaskService.getTaskById(req.user.id, id as string);
  return ApiResponse.success(res, { task }, 'Task retrieved successfully');
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required');
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const task = await TaskService.updateTask(req.user.id, id as string, req.body);
  return ApiResponse.success(res, { task }, 'Task updated successfully');
});

export const updateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required');
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const task = await TaskService.updateTaskStatus(
    req.user.id,
    id as string,
    req.body.status as TaskStatus
  );
  return ApiResponse.success(res, { task }, 'Task status updated successfully');
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required');
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await TaskService.deleteTask(req.user.id, id as string);
  return ApiResponse.success(res, null, 'Task deleted successfully');
});
