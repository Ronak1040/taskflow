import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { CheckSquare, Moon, Sun, Activity, Layers, LayoutDashboard, LogOut, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useHealth } from '../../hooks/useHealth';
import { Badge } from './Badge';
import { Button } from './Button';

export const Header: React.FC = () => {
  const { isDark, setTheme, theme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: health, loading: healthLoading } = useHealth(30000);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
      navigate('/login');
    } catch {
      toast.error('Logout failed.');
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
      isActive
        ? 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/40'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <NavLink to="/" className="flex items-center space-x-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                TaskFlow
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                Enterprise v1.0
              </span>
            </div>
          </NavLink>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                Architecture
              </span>
            </NavLink>
            <NavLink to="/health" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                Diagnostics
              </span>
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/dashboard" className={navLinkClass}>
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          {/* Live Backend Connection Indicator */}
          <div className="hidden sm:flex items-center">
            {healthLoading ? (
              <Badge variant="neutral" size="sm">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                Connecting...
              </Badge>
            ) : health?.status === 'healthy' ? (
              <Badge variant="success" size="sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                API Online
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {health?.status ? health.status.toUpperCase() : 'API Offline'}
              </Badge>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode (currently ${theme})`}
            aria-label="Toggle color theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Auth Controls */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs ring-2 ring-brand-500/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleLogout()}
                title="Log out"
                className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 p-2"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" leftIcon={<LogIn className="w-4 h-4" />}>
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
