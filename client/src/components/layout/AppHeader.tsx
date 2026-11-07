import React from 'react';
import { Menu, Plus, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useHealth } from '../../hooks/useHealth';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface AppHeaderProps {
  onToggleSidebar: () => void;
  onOpenCreateTask?: () => void;
  title?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onToggleSidebar,
  onOpenCreateTask,
  title,
}) => {
  const { isDark, setTheme } = useTheme();
  const { data: health, loading: healthLoading } = useHealth(30000);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center space-x-3">
        {/* Mobile sidebar toggle button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Backend Online Pill */}
        <div className="hidden sm:flex items-center">
          {healthLoading ? (
            <Badge variant="neutral" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              API Syncing
            </Badge>
          ) : health?.status === 'healthy' ? (
            <Badge variant="success" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </Badge>
          ) : (
            <Badge variant="warning" size="sm">
              Offline
            </Badge>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          aria-label="Toggle color theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Quick Add Task Button */}
        {onOpenCreateTask && (
          <Button
            size="sm"
            onClick={onOpenCreateTask}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">New Task</span>
          </Button>
        )}
      </div>
    </header>
  );
};
