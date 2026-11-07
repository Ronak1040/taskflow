import apiClient from './apiClient';
import type { ApiResponse, HealthData } from '../types/api';

export class HealthService {
  /**
   * Fetches backend system health metrics
   */
  static async checkHealth(): Promise<HealthData> {
    const response = await apiClient.get<ApiResponse<HealthData>>('/v1/health');
    return response.data.data;
  }
}
