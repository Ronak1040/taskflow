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
