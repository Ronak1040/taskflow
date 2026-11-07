import type { Response } from 'express';

export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: ApiResponsePayload['meta']
  ): Response<ApiResponsePayload<T>> {
    const payload: ApiResponsePayload<T> = {
      success: true,
      message,
      data,
      ...(meta && { meta }),
    };
    return res.status(statusCode).json(payload);
  }

  static created<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully',
    meta?: ApiResponsePayload['meta']
  ): Response<ApiResponsePayload<T>> {
    return this.success(res, data, message, 201, meta);
  }

  static error(
    res: Response,
    message = 'An error occurred',
    statusCode = 500,
    error?: unknown
  ): Response<ApiResponsePayload<null>> {
    const payload: ApiResponsePayload<null> = {
      success: false,
      message,
      ...(error !== undefined && { error }),
    };
    return res.status(statusCode).json(payload);
  }
}
