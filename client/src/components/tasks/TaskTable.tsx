import React from 'react';
import { Calendar, Edit2, Trash2 } from 'lucide-react';
import type { Task, TaskStatus } from '../../types/task';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { formatDate } from '../../utils';

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
          <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/75 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
            <th className="py-3 px-4">Task Details</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Priority</th>
            <th className="py-3 px-4">Due Date</th>
            <th className="py-3 px-4">Created</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {tasks.map((task) => {
            const isOverdue =
              task.dueDate &&
              new Date(task.dueDate) < new Date() &&
              task.status !== 'completed';

            return (
              <tr
                key={task.id}
                className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                {/* Title & Description */}
                <td className="py-3.5 px-4 max-w-sm">
                  <div className="space-y-0.5">
                    <span
                      className={`font-semibold block ${
                        task.status === 'completed'
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.description && (
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </td>

                {/* Status Column */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={task.status} size="sm" />
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
                      aria-label="Change status"
                      className="text-[10px] font-medium py-0.5 px-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
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
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        isOverdue
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(task.dueDate)}
                      {isOverdue && (
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-1 rounded">
                          Overdue
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">No date</span>
                  )}
                </td>

                {/* Created */}
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                  {formatDate(task.createdAt)}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => onEdit(task)}
                      title="Edit task"
                      className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(task.id)}
                      title="Delete task"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
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
