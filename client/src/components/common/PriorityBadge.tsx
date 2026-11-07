import React from 'react';
import type { TaskPriority } from '../../types/task';
import { cn } from '../../utils';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md', className }) => {
  const configs: Record<TaskPriority, { label: string; dot: string; styles: string }> = {
    low: {
      label: 'Low',
      dot: 'bg-slate-400 dark:bg-slate-500',
      styles: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    },
    medium: {
      label: 'Medium',
      dot: 'bg-amber-500 dark:bg-amber-400',
      styles: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    },
    high: {
      label: 'High',
      dot: 'bg-rose-500 dark:bg-rose-400',
      styles: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    },
  };

  const config = configs[priority] || configs.medium;

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1.5' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border shadow-2xs select-none transition-colors',
        config.styles,
        sizeClasses,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      <span>{config.label}</span>
    </span>
  );
};
