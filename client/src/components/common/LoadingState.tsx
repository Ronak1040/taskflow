import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  type?: 'spinner' | 'skeleton';
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  className,
  type = 'spinner',
  rows = 3,
}) => {
  if (type === 'skeleton') {
    return (
      <div className={cn('space-y-3 w-full animate-pulse', className)}>
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
    <div className={cn('flex flex-col items-center justify-center p-12 space-y-3 text-center', className)}>
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {message}
      </p>
    </div>
  );
};

