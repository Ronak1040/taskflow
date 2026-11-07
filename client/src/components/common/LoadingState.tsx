import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  type?: 'spinner' | 'skeleton' | 'stat-cards' | 'table' | 'cards';
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  className,
  type = 'spinner',
  rows = 3,
}) => {
  if (type === 'stat-cards') {
    return (
      <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-pulse', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16" />
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-12" />
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={cn('w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden animate-pulse', className)}>
        <div className="h-10 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800" />
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/5" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-3/5" />
              </div>
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-16" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-16" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-24" />
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'skeleton') {
    return (
      <div className={cn('space-y-3 w-full animate-pulse', className)} aria-label="Loading content">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col items-center justify-center p-12 space-y-3 text-center', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" aria-hidden="true" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {message}
      </p>
      <span className="sr-only">Loading</span>
    </div>
  );
};
