export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

export interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  environment: string;
  services: {
    database: {
      status: 'connected' | 'connecting' | 'disconnected' | 'disconnecting' | 'unknown';
      host?: string;
      name?: string;
    };
    memory: {
      heapUsedMb: number;
      heapTotalMb: number;
      rssMb: number;
    };
    system: {
      nodeVersion: string;
      platform: string;
    };
  };
}

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: unknown;
}
