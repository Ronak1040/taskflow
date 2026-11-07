import React from 'react';
import { Clock, CheckCircle2, CircleDot } from 'lucide-react';
import type { TaskStatus } from '../../types/task';
import { cn } from '../../utils';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className }) => {
  const configs: Record<TaskStatus, { label: string; styles: string; icon: React.ReactNode }> = {
    pending: {
      label: 'Pending',
      styles: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
      icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
    'in-progress': {
      label: 'In Progress',
      styles: 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
      icon: <CircleDot className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
    completed: {
      label: 'Completed',
      styles: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
  };

  const config = configs[status] || configs.pending;

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border shadow-2xs select-none transition-colors',
        config.styles,
        sizeClasses,
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

