import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HealthService } from '../services/healthService';
import type { HealthData, ApiError } from '../types/api';

export function useHealth(autoRefreshIntervalMs = 0) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const fetchHealth = useCallback(async (showToast = false) => {
    setLoading(true);
    setError(null);
    const start = performance.now();

    try {
      const result = await HealthService.checkHealth();
      const duration = Math.round(performance.now() - start);
      setData(result);
      setLatencyMs(duration);
      if (showToast) {
        toast.success(`Backend status: ${result.status.toUpperCase()} (${duration}ms)`);
      }
    } catch (err: unknown) {
      const errorObj = err as ApiError;
      const message = errorObj?.message || 'Failed to connect to backend service';
      setError(message);
      setData(null);
      if (showToast) {
        toast.error(`Health check failed: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHealth(false);

    if (autoRefreshIntervalMs > 0) {
      const interval = setInterval(() => {
        void fetchHealth(false);
      }, autoRefreshIntervalMs);
      return () => {
        clearInterval(interval);
      };
    }

    return undefined;
  }, [fetchHealth, autoRefreshIntervalMs]);

  return {
    data,
    loading,
    error,
    latencyMs,
    refresh: () => fetchHealth(true),
  };
}
