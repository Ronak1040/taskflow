import React, { useState } from 'react';
import {
  Activity,
  Database,
  RefreshCw,
  Cpu,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HardDrive,
  Code,
  Terminal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useHealth } from '../hooks/useHealth';
import { formatUptime, formatDate } from '../utils';

export const HealthCheckPage: React.FC = () => {
  const { data: health, loading, error, latencyMs, refresh } = useHealth();
  const [showRawJson, setShowRawJson] = useState(false);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return (
          <Badge variant="success" size="md">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            {status.toUpperCase()}
          </Badge>
        );
      case 'degraded':
      case 'connecting':
        return (
          <Badge variant="warning" size="md">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            {status.toUpperCase()}
          </Badge>
        );
      default:
        return (
          <Badge variant="error" size="md">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            {status ? status.toUpperCase() : 'OFFLINE'}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-brand-600" />
            System Diagnostics & Health
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time backend service inspection and database connectivity metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => void refresh()}
            isLoading={loading}
            variant="outline"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Metrics
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 flex items-center space-x-3">
          <XCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <div className="text-sm">
            <p className="font-semibold">Backend Unreachable</p>
            <p className="opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Status */}
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Overall Health
              </span>
              <Activity className="w-4 h-4 text-brand-600" />
            </div>
            <div className="pt-1">{getStatusBadge(health?.status)}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Environment: <span className="font-mono font-medium">{health?.environment || 'unknown'}</span>
            </p>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Database (MongoDB)
              </span>
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="pt-1">{getStatusBadge(health?.services.database.status)}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {health?.services.database.host ? `Host: ${health.services.database.host}` : 'Database ready'}
            </p>
          </CardContent>
        </Card>

        {/* Latency */}
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                API Latency
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white pt-1">
              {latencyMs !== null ? `${latencyMs} ms` : '—'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Round-trip HTTP execution
            </p>
          </CardContent>
        </Card>

        {/* Process Uptime */}
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Backend Uptime
              </span>
              <Cpu className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white pt-1">
              {health?.uptime !== undefined ? formatUptime(health.uptime) : '—'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {health?.timestamp ? formatDate(health.timestamp) : 'Not connected'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Technical Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Diagnostics */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-brand-600" />
              <CardTitle>Memory Allocation</CardTitle>
            </div>
            <CardDescription>Node.js V8 process memory footprint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {health?.services.memory ? (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Heap Used</span>
                    <span className="text-slate-900 dark:text-slate-200 font-mono">
                      {health.services.memory.heapUsedMb} MB / {health.services.memory.heapTotalMb} MB
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((health.services.memory.heapUsedMb / health.services.memory.heapTotalMb) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 block">Heap Used</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {health.services.memory.heapUsedMb} MB
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Heap Total</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {health.services.memory.heapTotalMb} MB
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Resident Set (RSS)</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {health.services.memory.rssMb} MB
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No memory metrics available</p>
            )}
          </CardContent>
        </Card>

        {/* Runtime & Environment */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-indigo-600" />
              <CardTitle>Runtime Environment</CardTitle>
            </div>
            <CardDescription>Host system and execution parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Node Engine</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {health?.services.system.nodeVersion || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Operating System</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {health?.services.system.platform || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Endpoint URL</span>
                <span className="font-mono text-xs text-brand-600 dark:text-brand-400">
                  http://localhost:5000/api/v1/health
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 dark:text-slate-400">Database Adapter</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  Mongoose / MongoDB
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raw JSON Inspector Toggle */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowRawJson(!showRawJson)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <CardTitle className="text-base">Raw API JSON Payload</CardTitle>
            </div>
            <Button variant="ghost" size="sm">
              {showRawJson ? 'Hide' : 'Inspect'}
            </Button>
          </div>
        </CardHeader>
        {showRawJson && (
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
              {JSON.stringify(health, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
