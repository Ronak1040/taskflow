import apiClient from './apiClient';
import type { ApiResponse } from '../types/api';
import type { DashboardStats } from '../types/task';

export class DashboardService {
  /**
   * Fetch authenticated user's task statistics
   */
  static async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<ApiResponse<{ stats: DashboardStats }>>('/dashboard/stats');
    return response.data.data.stats;
  }
}

