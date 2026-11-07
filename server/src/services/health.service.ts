import mongoose from 'mongoose';
import { env } from '../config/env.js';
import type { HealthStatus } from '../types/index.js';

export class HealthService {
  public static getHealth(): HealthStatus {
    const memory = process.memoryUsage();

    const dbStateMap: Record<number, HealthStatus['services']['database']['status']> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const readyState = mongoose.connection.readyState;
    const dbStatus = dbStateMap[readyState] ?? 'unknown';

    // Status: healthy if DB is connected, degraded if DB is connecting, unhealthy if disconnected
    let overallStatus: HealthStatus['status'] = 'healthy';
    if (dbStatus === 'connecting') {
      overallStatus = 'degraded';
    } else if (dbStatus !== 'connected') {
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      services: {
        database: {
          status: dbStatus,
          host: mongoose.connection.host || undefined,
          name: mongoose.connection.name || undefined,
        },
        memory: {
          heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
          heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
          rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
        },
      },
    };
  }
}
