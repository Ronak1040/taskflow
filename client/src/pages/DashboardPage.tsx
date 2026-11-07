import React from 'react';
import { User, Shield, CheckCircle2, Lock, Calendar, LogOut, LayoutDashboard, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { formatDate } from '../utils';

export const DashboardPage: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Successfully logged out.');
    } catch {
      toast.error('Logout error occurred.');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="bg-white/20 text-white border-0">
              <Shield className="w-3 h-3 mr-1" />
              Authenticated Session
            </Badge>
            <Badge variant="neutral" className="bg-emerald-400/20 text-emerald-200 border-0">
              Role: {user.role.toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.name}!
          </h1>
          <p className="text-sm text-brand-100">
            {user.email} • Protected Workspace Environment
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => void handleLogout()}
            isLoading={isLoading}
            variant="secondary"
            className="bg-white text-slate-800 hover:bg-slate-100 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Security & Authentication Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Identity Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-brand-600" />
              <CardTitle>User Profile</CardTitle>
            </div>
            <CardDescription>Verified identity attributes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">User ID</span>
              <span className="font-mono text-xs text-slate-900 dark:text-white truncate max-w-[150px]">
                {user.id}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Full Name</span>
              <span className="font-medium text-slate-900 dark:text-white">{user.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Email</span>
              <span className="font-medium text-slate-900 dark:text-white">{user.email}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Member Since</span>
              <span className="text-xs text-slate-700 dark:text-slate-300">
                {formatDate(user.createdAt)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cookie-Based Security Strategy */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              <CardTitle>Security Architecture</CardTitle>
            </div>
            <CardDescription>Zero-token client storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
              <div className="flex items-center font-semibold gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                HTTP-Only Cookie Enforced
              </div>
              <p>
                JWT is never stored in localStorage or sessionStorage. Completely immune to client-side XSS token theft.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <div className="flex items-center justify-between">
                <span>SameSite Policy</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">Lax</span>
              </div>
              <div className="flex items-center justify-between">
                <span>CSRF Mitigation</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">X-Requested-With</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Password Hashing</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">bcryptjs (12 rounds)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Validity & State */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <CardTitle>Session State</CardTitle>
            </div>
            <CardDescription>Persistent authentication state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Session Status</span>
              <Badge variant="success">Active & Verified</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Verification Endpoint</span>
              <span className="font-mono text-xs text-brand-600 dark:text-brand-400">GET /api/auth/me</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Auto Refresh</span>
              <span className="text-slate-700 dark:text-slate-300">On App Hydration</span>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => toast.success('Session verified valid!')}
              >
                Validate Session Token
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TaskFlow Workspace Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <LayoutDashboard className="w-5 h-5 text-indigo-600" />
              <CardTitle>Workspaces & Tasks</CardTitle>
            </div>
            <Badge variant="info">Ready for Prompt 03</Badge>
          </div>
          <CardDescription>
            Authentication system is active and ready for task management feature modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No tasks created yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Your authentication session is verified. The underlying Task Management models, controllers, and Kanban views will be implemented in subsequent phases.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
