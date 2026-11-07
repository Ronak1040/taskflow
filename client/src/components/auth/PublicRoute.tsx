import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface PublicRouteProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

/**
 * PublicRoute ensures authenticated users cannot access guest-only pages
 * such as /login and /register, redirecting them to /dashboard instead.
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = '/dashboard',
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Checking authentication...
        </p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
