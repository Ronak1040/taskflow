export interface HealthStatus {
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

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponseData {
  user: AuthenticatedUser;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  [key: string]: unknown;
}

export interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}
