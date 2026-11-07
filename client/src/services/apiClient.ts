import axios, { AxiosError } from 'axios';
import type { ApiError } from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Automatically transmits and receives HTTP-only cookies
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF mitigation header
  },
});

// Response interceptor to format errors uniformly and broadcast session expiration
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ message?: string; details?: unknown }>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    let message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    if (status === 403 && !error.response?.data?.message) {
      message = 'Access forbidden: you do not have permission or CSRF validation failed.';
    }

    const formattedError: ApiError = {
      message,
      statusCode: status,
      details: error.response?.data?.details,
    };

    // If an authenticated endpoint returns 401 (excluding auth check and login/registration),
    // trigger a global session-expired event so AuthContext immediately clears credentials.
    if (
      status === 401 &&
      !requestUrl.includes('/auth/login') &&
      !requestUrl.includes('/auth/register') &&
      !requestUrl.includes('/auth/me')
    ) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('taskflow:session-expired', {
            detail: { message: formattedError.message },
          })
        );
      }
    }

    return Promise.reject(formattedError);
  }
);

export default apiClient;
