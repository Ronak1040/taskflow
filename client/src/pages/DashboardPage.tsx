import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ListTodo,
  Clock,
  CircleDot,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingUp,
  Plus,
  AlertCircle,
  RefreshCw,
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
import { getRelativeDateInfo, formatDateOnly } from '../utils';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load dashboard metrics';
      toast.error(errorMsg);
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create task';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (task: Task, nextStatus: TaskStatus) => {
    setUpdatingTaskId(task.id);
    try {
      await TaskService.updateTaskStatus(task.id, nextStatus);
      toast.success(`Task status updated to ${nextStatus}`);
      void fetchDashboardData();
      window.dispatchEvent(new CustomEvent('taskflow:task-changed'));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update task status';
      toast.error(errorMsg);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Completion calculation
  const completionPercentage = stats?.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {user?.name ?? 'User'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time workflow metrics, deadlines, and sprint execution
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchDashboardData()}
            title="Refresh dashboard metrics"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
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
        <LoadingState type="stat-cards" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Tasks"
            value={stats?.total ?? 0}
            description="All workspace tasks"
            icon={<ListTodo className="w-5 h-5" />}
            iconBg="bg-slate-100 dark:bg-slate-800"
            iconColor="text-slate-700 dark:text-slate-200"
            onClick={() => navigate('/tasks')}
          />
          <StatCard
            title="Pending"
            value={stats?.pending ?? 0}
            description="Waiting to start"
            icon={<Clock className="w-5 h-5" />}
            iconBg="bg-amber-50 dark:bg-amber-950/40"
            iconColor="text-amber-600 dark:text-amber-400"
            onClick={() => navigate('/tasks?status=pending')}
          />
          <StatCard
            title="In Progress"
            value={stats?.inProgress ?? 0}
            description="Active sprint items"
            icon={<CircleDot className="w-5 h-5" />}
            iconBg="bg-sky-50 dark:bg-sky-950/40"
            iconColor="text-sky-600 dark:text-sky-400"
            onClick={() => navigate('/tasks?status=in-progress')}
          />
          <StatCard
            title="Completed"
            value={stats?.completed ?? 0}
            description={`${completionPercentage}% completion rate`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
            iconColor="text-emerald-600 dark:text-emerald-400"
            onClick={() => navigate('/tasks?status=completed')}
          />
          <StatCard
            title="Overdue"
            value={stats?.overdue ?? 0}
            description="Past target deadline"
            icon={<Calendar className="w-5 h-5" />}
            iconBg="bg-rose-50 dark:bg-rose-950/40"
            iconColor="text-rose-600 dark:text-rose-400"
            isAlert={Boolean(stats && stats.overdue > 0)}
            onClick={() => navigate('/tasks')}
          />
        </div>
      )}

      {/* 3. Task Overview Progress Card */}
      <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sprint Completion Velocity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time ratio of completed items against your entire workspace
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-900/60">
                {completionPercentage}% Complete
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                ({stats?.completed ?? 0} of {stats?.total ?? 0})
              </span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-600 to-brand-500 h-3.5 rounded-full transition-all duration-700 ease-out shadow-xs"
              style={{ width: `${completionPercentage}%` }}
              role="progressbar"
              aria-valuenow={completionPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* Metric Columns */}
          <div className="grid grid-cols-3 gap-4 pt-4 mt-3 text-xs border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Pending Queue
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {stats?.pending ?? 0}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                In Active Pipeline
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {stats?.inProgress ?? 0}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Total Capacity
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {stats?.total ?? 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Dual Grid: Recent Tasks & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card className="shadow-2xs border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Tasks
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Latest additions and modifications in your active workspace
                </CardDescription>
              </div>
              <Link
                to="/tasks"
                className="text-xs font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 flex items-center gap-1 group"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </CardHeader>

            <CardContent className="pt-3">
              {isLoading ? (
                <LoadingState type="skeleton" rows={4} />
              ) : recentTasks.length === 0 ? (
                <EmptyState
                  icon={<ListTodo className="w-8 h-8 text-slate-400" />}
                  title="No recent tasks"
                  description="Your workspace is currently clean. Start tracking your projects by adding an item."
                  actionText="Create Task"
                  onAction={() => setIsCreateModalOpen(true)}
                />
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-850/50 px-2 rounded-lg transition-colors"
                    >
                      <div className="space-y-0.5 truncate max-w-[65%]">
                        <span
                          className={`font-semibold block truncate leading-snug ${
                            task.status === 'completed'
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          Created {formatDateOnly(task.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={task.status} size="sm" />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleStatusChange(
                              task,
                              task.status === 'completed' ? 'pending' : 'completed'
                            )
                          }
                          isLoading={updatingTaskId === task.id}
                          className="text-[11px] h-7 px-2"
                        >
                          {task.status === 'completed' ? 'Reopen' : 'Done'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="shadow-2xs border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Upcoming Deadlines
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Target milestones requiring attention
                </CardDescription>
              </div>
              <Link
                to="/tasks"
                className="text-xs font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 flex items-center gap-1 group"
              >
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </CardHeader>

            <CardContent className="pt-3">
              {isLoading ? (
                <LoadingState type="skeleton" rows={4} />
              ) : upcomingDeadlines.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="w-8 h-8 text-slate-400" />}
                  title="No upcoming deadlines"
                  description="You are all caught up! No scheduled task deadlines are pending."
                />
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {upcomingDeadlines.map((task) => {
                    const dateInfo = getRelativeDateInfo(task.dueDate);
                    const isOverdue = dateInfo.isOverdue && task.status !== 'completed';

                    return (
                      <div
                        key={task.id}
                        className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-850/50 px-2 rounded-lg transition-colors"
                      >
                        <div className="space-y-0.5 truncate max-w-[60%]">
                          <span className="font-semibold text-slate-900 dark:text-white block truncate leading-snug">
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 text-[11px]">
                            <PriorityBadge priority={task.priority} size="sm" />
                            <span
                              className={
                                isOverdue
                                  ? 'text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1'
                                  : dateInfo.isToday
                                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                  : 'text-slate-500 dark:text-slate-400'
                              }
                            >
                              {isOverdue && <AlertCircle className="w-3 h-3 text-rose-500" />}
                              {dateInfo.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isOverdue && (
                            <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                              Overdue
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(task, 'completed')}
                            isLoading={updatingTaskId === task.id}
                            className="text-xs h-7 px-2.5"
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
          </div>
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
