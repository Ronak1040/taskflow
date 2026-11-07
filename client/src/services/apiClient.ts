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

// Response interceptor to format errors uniformly
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ message?: string; details?: unknown }>) => {
    const formattedError: ApiError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      statusCode: error.response?.status,
      details: error.response?.data?.details,
    };

    return Promise.reject(formattedError);
  }
);

export default apiClient;
