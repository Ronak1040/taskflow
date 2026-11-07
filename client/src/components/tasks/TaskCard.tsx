import React from 'react';
import { Calendar, Edit2, Trash2, AlertCircle } from 'lucide-react';
import type { Task, TaskStatus } from '../../types/task';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { getRelativeDateInfo, cn } from '../../utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const dateInfo = getRelativeDateInfo(task.dueDate);
  const isOverdue = dateInfo.isOverdue && task.status !== 'completed';

  // Left border accent color depending on state
  const getStatusBorder = () => {
    if (isOverdue) return 'border-l-4 border-l-rose-500';
    if (task.status === 'completed') return 'border-l-4 border-l-emerald-500/80';
    if (task.status === 'in-progress') return 'border-l-4 border-l-sky-500';
    return 'border-l-4 border-l-amber-400';
  };

  return (
    <div
      className={cn(
        'group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150 flex flex-col justify-between space-y-3.5',
        getStatusBorder()
      )}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={task.status} size="sm" />
          <PriorityBadge priority={task.priority} size="sm" />
        </div>

        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            title="Edit task"
            aria-label={`Edit task "${task.title}"`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            title="Delete task"
            aria-label={`Delete task "${task.title}"`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Content */}
      <div className="space-y-1.5">
        <h4
          className={cn(
            'text-sm font-semibold tracking-tight transition-colors leading-snug',
            task.status === 'completed'
              ? 'line-through text-slate-400 dark:text-slate-500'
              : 'text-slate-900 dark:text-white'
          )}
        >
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer Details & Status Quick Changer */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          {task.dueDate ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-medium',
                isOverdue
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : dateInfo.isToday
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300'
              )}
            >
              {isOverdue && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
              {dateInfo.label}
            </span>
          ) : (
            <span className="text-slate-400 italic text-[11px]">No due date</span>
          )}
        </div>

        {/* Quick status transition dropdown */}
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
          aria-label={`Change status for "${task.title}"`}
          className="text-[11px] font-medium py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>
  );
};
