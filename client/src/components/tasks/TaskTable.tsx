import React from 'react';
import { Calendar, Edit2, Trash2, AlertCircle } from 'lucide-react';
import type { Task, TaskStatus } from '../../types/task';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { formatDateOnly, getRelativeDateInfo, cn } from '../../utils';

interface TaskTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
            <th scope="col" className="py-3 px-4">Task Details</th>
            <th scope="col" className="py-3 px-4">Workflow Status</th>
            <th scope="col" className="py-3 px-4">Priority</th>
            <th scope="col" className="py-3 px-4">Due Date</th>
            <th scope="col" className="py-3 px-4">Created Date</th>
            <th scope="col" className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {tasks.map((task) => {
            const dateInfo = getRelativeDateInfo(task.dueDate);
            const isOverdue = dateInfo.isOverdue && task.status !== 'completed';

            return (
              <tr
                key={task.id}
                className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Title & Description */}
                <td className="py-3.5 px-4 max-w-sm">
                  <div className="space-y-0.5">
                    <span
                      className={cn(
                        'font-semibold block transition-colors leading-snug',
                        task.status === 'completed'
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      )}
                    >
                      {task.title}
                    </span>
                    {task.description && (
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1 leading-normal">
                        {task.description}
                      </p>
                    )}
                  </div>
                </td>

                {/* Status Column */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} size="sm" />
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
                      aria-label={`Change status for "${task.title}"`}
                      className="text-[10px] font-medium py-0.5 px-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 opacity-60 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs"
                    >
                      <option value="pending">Set Pending</option>
                      <option value="in-progress">Set In Progress</option>
                      <option value="completed">Set Completed</option>
                    </select>
                  </div>
                </td>

                {/* Priority */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <PriorityBadge priority={task.priority} size="sm" />
                </td>

                {/* Due Date */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {task.dueDate ? (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span
                        className={cn(
                          'text-xs font-medium',
                          isOverdue
                            ? 'text-rose-600 dark:text-rose-400 font-semibold'
                            : dateInfo.isToday
                            ? 'text-amber-600 dark:text-amber-400 font-semibold'
                            : 'text-slate-600 dark:text-slate-300'
                        )}
                      >
                        {formatDateOnly(task.dueDate)}
                      </span>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-1.5 py-0.2 rounded-full border border-rose-200 dark:border-rose-900">
                          <AlertCircle className="w-2.5 h-2.5" /> Overdue
                        </span>
                      )}
                      {dateInfo.isToday && !isOverdue && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-200 dark:border-amber-900">
                          Today
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">No due date</span>
                  )}
                </td>

                {/* Created */}
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                  {formatDateOnly(task.createdAt)}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-1">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
