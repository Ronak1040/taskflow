import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils';

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

interface FilterDropdownProps<T extends string = string> {
  label: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  icon?: React.ReactNode;
}

export const FilterDropdown = <T extends string = string>({
  label,
  value,
  options,
  onChange,
  className,
  icon,
}: FilterDropdownProps<T>): React.ReactElement => {
  return (
    <div className={cn('relative inline-flex items-center text-xs font-medium', className)}>
      <div className="relative flex items-center w-full">
        {icon && <span className="absolute left-2.5 text-slate-400 pointer-events-none">{icon}</span>}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-label={label}
          className={cn(
            'appearance-none w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-2xs transition-colors cursor-pointer',
            icon ? 'pl-8 pr-7' : 'pl-3 pr-7'
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
};

