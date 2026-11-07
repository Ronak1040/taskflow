import React from 'react';
import { Card, CardContent } from './Card';
import { cn } from '../../utils';

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trendText?: string;
  isAlert?: boolean;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  iconBg = 'bg-slate-100 dark:bg-slate-800',
  iconColor = 'text-slate-600 dark:text-slate-300',
  trendText,
  isAlert = false,
  className,
  onClick,
}) => {
  return (
    <Card
      className={cn(
        'group transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        onClick && 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.99]',
        isAlert && 'border-rose-200/80 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={onClick ? `View ${title}: ${value}` : undefined}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {title}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {value}
            </div>
          </div>
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 shadow-2xs',
              iconBg,
              iconColor
            )}
          >
            {icon}
          </div>
        </div>

        {(description || trendText) && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {description && <span className="truncate">{description}</span>}
            {trendText && (
              <span
                className={cn(
                  'font-semibold text-[11px]',
                  isAlert ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                )}
              >
                {trendText}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
