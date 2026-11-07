import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ListTodo,
  Clock,
  CircleDot,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardService } from '../services/dashboardService';
import { TaskService } from '../services/taskService';
import type { Task, DashboardStats, TaskStatus, CreateTaskPayload, UpdateTaskPayload } from '../types/task';
import { StatCard } from '../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { TaskModal } from '../components/tasks/TaskModal';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, recentData, upcomingData] = await Promise.all([
        DashboardService.getStats(),
        TaskService.getTasks({ sortBy: 'createdAt', order: 'desc', limit: 5 }),
        TaskService.getTasks({
          status: 'pending',
          sortBy: 'dueDate',
          order: 'asc',
          limit: 20,
        }),
      ]);

      setStats(statsData);
      setRecentTasks(recentData.tasks);
      // Filter out tasks without dueDate for upcoming deadlines and take top 5
      setUpcomingDeadlines(upcomingData.tasks.filter((t) => Boolean(t.dueDate)).slice(0, 5));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();

    // Listen for global task created/changed events
    const listener = () => void fetchDashboardData();
    window.addEventListener('taskflow:task-created', listener);
    window.addEventListener('taskflow:task-changed', listener);
    return () => {
      window.removeEventListener('taskflow:task-created', listener);
      window.removeEventListener('taskflow:task-changed', listener);
    };
  }, [fetchDashboardData]);

  const handleCreateTask = async (data: CreateTaskPayload | UpdateTaskPayload) => {
    setIsSubmitting(true);
    try {
      await TaskService.createTask(data as CreateTaskPayload);
      toast.success('Task created successfully');
      setIsCreateModalOpen(false);
      void fetchDashboardData();
      window.dispatchEvent(new CustomEvent('taskflow:task-changed'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (task: Task, nextStatus: TaskStatus) => {
    try {
      await TaskService.updateTaskStatus(task.id, nextStatus);
      toast.success(`Task status updated to ${nextStatus}`);
      void fetchDashboardData();
      window.dispatchEvent(new CustomEvent('taskflow:task-changed'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task status');
    }
  };

  // Completion calculation
  const completionPercentage = stats?.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {user?.name ?? 'User'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Here is your real-time task management overview and active sprint performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/tasks">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Tasks
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* 2. Statistics Cards */}
      {isLoading ? (
        <LoadingState type="skeleton" rows={1} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Tasks"
            value={stats?.total ?? 0}
            description="All active & done"
            icon={<ListTodo className="w-5 h-5" />}
            iconBg="bg-slate-100 dark:bg-slate-800"
            iconColor="text-slate-700 dark:text-slate-200"
          />
          <StatCard
            title="Pending"
            value={stats?.pending ?? 0}
            description="Waiting to start"
            icon={<Clock className="w-5 h-5" />}
            iconBg="bg-amber-50 dark:bg-amber-950/40"
            iconColor="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            title="In Progress"
            value={stats?.inProgress ?? 0}
            description="Actively worked on"
            icon={<CircleDot className="w-5 h-5" />}
            iconBg="bg-sky-50 dark:bg-sky-950/40"
            iconColor="text-sky-600 dark:text-sky-400"
          />
          <StatCard
            title="Completed"
            value={stats?.completed ?? 0}
            description={`${completionPercentage}% completion rate`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            title="Overdue"
            value={stats?.overdue ?? 0}
            description="Past due deadline"
            icon={<Calendar className="w-5 h-5" />}
            iconBg="bg-rose-50 dark:bg-rose-950/40"
            iconColor="text-rose-600 dark:text-rose-400"
            isAlert={Boolean(stats && stats.overdue > 0)}
          />
        </div>
      )}

      {/* 3. Task Overview Progress Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Sprint Completion Progress
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {stats?.completed ?? 0} of {stats?.total ?? 0} completed ({completionPercentage}%)
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-brand-600 h-3 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 mt-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="block text-[11px] text-slate-400">Backlog Pending</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{stats?.pending ?? 0}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-400">In Active Pipeline</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{stats?.inProgress ?? 0}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-400">Total Velocity</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{stats?.total ?? 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Dual Grid: Recent Tasks & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Recent Tasks</CardTitle>
              <CardDescription className="text-xs">
                Latest additions to your workspace
              </CardDescription>
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-brand-600 hover:text-brand-500">
              View All
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <LoadingState type="skeleton" rows={3} />
            ) : recentTasks.length === 0 ? (
              <EmptyState
                icon={<ListTodo className="w-6 h-6" />}
                title="No recent tasks"
                description="Start tracking your items by creating your first task."
                actionText="Create Task"
                onAction={() => setIsCreateModalOpen(true)}
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 truncate max-w-[65%]">
                      <span className={`font-semibold block truncate ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {task.title}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {formatDate(task.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge status={task.status} size="sm" />
                      <button
                        onClick={() => handleStatusChange(task, task.status === 'completed' ? 'pending' : 'completed')}
                        className="text-[11px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                      >
                        {task.status === 'completed' ? 'Reopen' : 'Done'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Upcoming Deadlines</CardTitle>
              <CardDescription className="text-xs">
                Items scheduled for completion soon
              </CardDescription>
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-brand-600 hover:text-brand-500">
              Manage
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <LoadingState type="skeleton" rows={3} />
            ) : upcomingDeadlines.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-6 h-6" />}
                title="No upcoming deadlines"
                description="You are all caught up! No pending deadlines scheduled."
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingDeadlines.map((task) => {
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    task.status !== 'completed';

                  return (
                    <div
                      key={task.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 truncate max-w-[60%]">
                        <span className="font-semibold text-slate-900 dark:text-white block truncate">
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <PriorityBadge priority={task.priority} size="sm" />
                          <span
                            className={
                              isOverdue
                                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                : 'text-slate-500'
                            }
                          >
                            Due: {task.dueDate ? formatDate(task.dueDate) : 'No date'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isOverdue && (
                          <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                            Overdue
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(task, 'completed')}
                          className="text-xs"
                        >
                          Finish
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Task Modal */}
      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        isLoading={isSubmitting}
      />
    </div>
  );
};
