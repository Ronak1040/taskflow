import apiClient from './apiClient';
import type { ApiResponse } from '../types/api';
import type { User, RegisterPayload, LoginPayload } from '../types/auth';

export class AuthService {
  /**
   * Registers a new user account.
   * Server sets HTTP-only authentication cookie automatically.
   */
  static async register(payload: RegisterPayload): Promise<User> {
    const response = await apiClient.post<ApiResponse<{ user: User }>>('/auth/register', payload);
    return response.data.data.user;
  }

  /**
   * Logs in with email and password.
   * Server sets HTTP-only authentication cookie automatically.
   */
  static async login(payload: LoginPayload): Promise<User> {
    const response = await apiClient.post<ApiResponse<{ user: User }>>('/auth/login', payload);
    return response.data.data.user;
  }

  /**
   * Logs out the user and clears HTTP-only cookie.
   */
  static async logout(): Promise<void> {
    await apiClient.post<ApiResponse<null>>('/auth/logout');
  }

  /**
   * Retrieves the current authenticated user via session cookie.
   */
  static async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data.user;
  }
}
