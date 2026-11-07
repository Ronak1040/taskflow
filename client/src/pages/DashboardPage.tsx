import React, { useEffect, useState, useCallback } from 'react';
import {
  Shield,
  CheckCircle2,
  Calendar,
  LogOut,
  Plus,
  Search,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle,
  ListTodo,
  Layers,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { DashboardService } from '../services/dashboardService';
import { TaskService } from '../services/taskService';
import type { Task, DashboardStats, TaskStatus, TaskPriority } from '../types/task';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { formatDate } from '../utils';

export const DashboardPage: React.FC = () => {
  const { user, logout, isLoading: authLoading } = useAuth();

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');

  // New task form state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Fetch stats and tasks
  const loadDashboardData = useCallback(async () => {
    try {
      const statsData = await DashboardService.getStats();
      setStats(statsData);
    } catch {
      // stats error handled silently or via fallback
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const result = await TaskService.getTasks({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        sortBy: 'createdAt',
        order: 'desc',
        limit: 50,
      });
      setTasks(result.tasks);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch tasks');
    } finally {
      setLoadingTasks(false);
    }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    setIsCreating(true);
    try {
      await TaskService.createTask({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        priority: newPriority,
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
      });

      toast.success('Task created successfully!');
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setShowCreateModal(false);
      void loadTasks();
      void loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (task: Task, nextStatus: TaskStatus) => {
    try {
      await TaskService.updateTaskStatus(task.id, nextStatus);
      toast.success(`Task marked as ${nextStatus}`);
      void loadTasks();
      void loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await TaskService.deleteTask(taskId);
      toast.success('Task deleted');
      void loadTasks();
      void loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete task');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Successfully logged out.');
    } catch {
      toast.error('Logout error occurred.');
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return <Badge variant="error" size="sm">High Priority</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm">Medium</Badge>;
      case 'low':
        return <Badge variant="neutral" size="sm">Low</Badge>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'in-progress':
        return <Badge variant="info" size="sm"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'pending':
        return <Badge variant="neutral" size="sm"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & User Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="bg-white/20 text-white border-0">
              <Shield className="w-3 h-3 mr-1" />
              Authenticated Session
            </Badge>
            <Badge variant="neutral" className="bg-emerald-400/20 text-emerald-200 border-0">
              Role: {user.role.toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.name}!
          </h1>
          <p className="text-sm text-brand-100">
            {user.email} • TaskFlow Workspace
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            size="md"
            className="bg-white text-brand-700 hover:bg-brand-50 shadow-md font-semibold"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Task
          </Button>
          <Button
            onClick={() => void handleLogout()}
            isLoading={authLoading}
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20 border-white/20"
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Live Dashboard Statistics Cards (GET /api/dashboard/stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Tasks */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Tasks</span>
              <ListTodo className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.total ?? '—'}
            </div>
            <p className="text-[11px] text-slate-400">All registered tasks</p>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.pending ?? '—'}
            </div>
            <p className="text-[11px] text-slate-400">Waiting to start</p>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">In Progress</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.inProgress ?? '—'}
            </div>
            <p className="text-[11px] text-slate-400">Actively worked on</p>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.completed ?? '—'}
            </div>
            <p className="text-[11px] text-slate-400">Finished tasks</p>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors col-span-2 sm:col-span-1">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overdue</span>
              <Calendar className="w-4 h-4 text-red-500" />
            </div>
            <div className={`text-2xl font-bold ${stats?.overdue ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
              {stats?.overdue ?? '—'}
            </div>
            <p className="text-[11px] text-slate-400">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks by title..."
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Status Filter */}
              <div className="flex items-center space-x-1 text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Status:
                </span>
                {(['', 'pending', 'in-progress', 'completed'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                      statusFilter === s
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {s || 'All'}
                  </button>
                ))}
              </div>

              {/* Priority Filter */}
              <div className="flex items-center space-x-1 text-xs pl-2 border-l border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Priority:</span>
                {(['', 'high', 'medium', 'low'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                      priorityFilter === p
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {p || 'All'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-brand-600" />
              <CardTitle>Task Management</CardTitle>
            </div>
            <span className="text-xs text-slate-500">
              Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTasks ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No tasks match your criteria
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a new task to get started or clear filters.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Task
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {task.title}
                      </span>
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Created {formatDate(task.createdAt)}</span>
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-500 font-semibold' : ''}`}>
                          <Calendar className="w-3 h-3" /> Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Status Toggle Action */}
                    {task.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(task, task.status === 'pending' ? 'in-progress' : 'completed')}
                        className="text-xs"
                      >
                        {task.status === 'pending' ? 'Start' : 'Complete'}
                      </Button>
                    )}
                    {task.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(task, 'pending')}
                        className="text-xs text-slate-500"
                      >
                        Reopen
                      </Button>
                    )}

                    {/* Delete Task */}
                    <button
                      onClick={() => void handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create New Task</CardTitle>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>
              <CardDescription>
                Tasks are assigned to your authenticated user account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Review PR for API auth"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Provide additional task context or acceptance criteria..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Priority
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isCreating}>
                    Create Task
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
