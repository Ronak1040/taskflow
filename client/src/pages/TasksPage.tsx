import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TaskService } from '../services/taskService';
import type {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '../types/task';
import { SearchBar } from '../components/common/SearchBar';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskTable } from '../components/tasks/TaskTable';
import { TaskModal } from '../components/tasks/TaskModal';

export const TasksPage: React.FC = () => {
  // Task data & pagination state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const limit = 10;
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPrevPage, setHasPrevPage] = useState<boolean>(false);

  // Filters & sorting
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt' | 'title' | 'priority'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals & action states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete dialog state
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Debounce search input to prevent duplicate API requests and race conditions
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await TaskService.getTasks({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        sortBy,
        order: sortOrder,
        page,
        limit,
      });

      setTasks(response.tasks);
      if (response.meta) {
        setTotal(response.meta.total);
        setTotalPages(response.meta.totalPages);
        setHasNextPage(response.meta.hasNextPage);
        setHasPrevPage(response.meta.hasPrevPage);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve tasks';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, priorityFilter, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    void fetchTasks();

    const listener = () => void fetchTasks();
    window.addEventListener('taskflow:task-created', listener);
    window.addEventListener('taskflow:task-changed', listener);
    return () => {
      window.removeEventListener('taskflow:task-created', listener);
      window.removeEventListener('taskflow:task-changed', listener);
    };
  }, [fetchTasks]);

  // Reset page to 1 when filters change
  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val as TaskStatus | '');
    setPage(1);
  };

  const handlePriorityFilterChange = (val: string) => {
    setPriorityFilter(val as TaskPriority | '');
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setPriorityFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchInput || statusFilter || priorityFilter);

  // Create or Update task submit
  const handleModalSubmit = async (data: CreateTaskPayload | UpdateTaskPayload) => {
    setIsSubmitting(true);
    try {
      if (taskToEdit) {
        await TaskService.updateTask(taskToEdit.id, data);
        toast.success('Task updated successfully');
      } else {
        await TaskService.createTask(data as CreateTaskPayload);
        toast.success('Task created successfully');
      }
      setIsModalOpen(false);
      setTaskToEdit(null);
      void fetchTasks();
      window.dispatchEvent(new CustomEvent('taskflow:task-changed'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick inline status change
  const handleStatusChange = async (task: Task, nextStatus: TaskStatus) => {
    try {
      await TaskService.updateTaskStatus(task.id, nextStatus);
      toast.success(`Task moved to ${nextStatus}`);
      void fetchTasks();
      window.dispatchEvent(new CustomEvent('taskflow:task-changed'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await TaskService.deleteTask(taskToDelete.id);
      toast.success(`"${taskToDelete.title}" deleted successfully`);
      setTaskToDelete(null);
      void fetchTasks();
      window.dispatchEvent(new CustomEvent('taskflow:task-changed'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete task';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title & Main Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Task Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize, filter, and track all tasks across your active workflows
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setTaskToEdit(null);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Task
        </Button>
      </div>

      {/* Control Panel: Search, Filters, Sorters, View Switcher */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5 shadow-2xs">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search bar */}
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search tasks by title..."
            className="w-full lg:max-w-xs"
          />

          {/* Filter and View Mode Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <FilterDropdown
              label="Filter by Status"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              icon={<Filter className="w-3.5 h-3.5" />}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
              ]}
            />

            {/* Priority Filter */}
            <FilterDropdown
              label="Filter by Priority"
              value={priorityFilter}
              onChange={handlePriorityFilterChange}
              icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'high', label: 'High Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'low', label: 'Low Priority' },
              ]}
            />

            {/* Sort Field */}
            <FilterDropdown
              label="Sort by Field"
              value={sortBy}
              onChange={(val) => setSortBy(val as 'dueDate' | 'createdAt' | 'title' | 'priority')}
              icon={<ArrowUpDown className="w-3.5 h-3.5" />}
              options={[
                { value: 'createdAt', label: 'Sort: Created Date' },
                { value: 'dueDate', label: 'Sort: Due Date' },
                { value: 'title', label: 'Sort: Title' },
                { value: 'priority', label: 'Sort: Priority' },
              ]}
            />

            {/* Order Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Switch order: currently ${sortOrder.toUpperCase()}`}
              aria-label={`Switch sort order: currently ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
              className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
            >
              {sortOrder === 'asc' ? 'Asc ↑' : 'Desc ↓'}
            </button>

            {/* View Mode Switcher (Table vs Cards) */}
            <div
              role="group"
              aria-label="View layout switcher"
              className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-800/60 ml-auto sm:ml-0"
            >
              <button
                onClick={() => setViewMode('table')}
                aria-label="Switch to table view"
                aria-pressed={viewMode === 'table'}
                className={`p-1.5 rounded-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-2xs font-semibold'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                aria-label="Switch to card grid view"
                aria-pressed={viewMode === 'cards'}
                className={`p-1.5 rounded-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-2xs font-semibold'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Active Filters:
              </span>
              {searchInput && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900 text-[11px]">
                  Search: &quot;{searchInput}&quot;
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                  Status: {statusFilter}
                </span>
              )}
              {priorityFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                  Priority: {priorityFilter}
                </span>
              )}
            </div>
            <button
              onClick={handleClearAllFilters}
              className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-semibold flex items-center gap-1 transition-colors hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Task Content: Table or Cards */}
      {loading ? (
        <LoadingState type={viewMode === 'table' ? 'table' : 'cards'} rows={5} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="w-8 h-8 text-slate-400" />}
          title="No tasks found"
          description={
            hasActiveFilters
              ? 'No tasks match your selected search or filter criteria. Try broadening your parameters.'
              : 'You have no tasks created yet. Click below to add your first item.'
          }
          actionText={hasActiveFilters ? 'Clear Filters' : 'Create Task'}
          onAction={() => {
            if (hasActiveFilters) {
              handleClearAllFilters();
            } else {
              setTaskToEdit(null);
              setIsModalOpen(true);
            }
          }}
        />
      ) : viewMode === 'table' ? (
        <TaskTable
          tasks={tasks}
          onEdit={(t) => {
            setTaskToEdit(t);
            setIsModalOpen(true);
          }}
          onDelete={(id) => {
            const match = tasks.find((t) => t.id === id);
            if (match) setTaskToDelete(match);
          }}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={(t) => {
                setTaskToEdit(t);
                setIsModalOpen(true);
              }}
              onDelete={(id) => {
                const match = tasks.find((t) => t.id === id);
                if (match) setTaskToDelete(match);
              }}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> total tasks
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrevPage || loading}
              onClick={() => setPage(page - 1)}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <span className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 text-xs">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNextPage || loading}
              onClick={() => setPage(page + 1)}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }}
        onSubmit={handleModalSubmit}
        taskToEdit={taskToEdit}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        title="Delete Task"
        message={
          taskToDelete
            ? `Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.`
            : 'Are you sure you want to delete this task?'
        }
        confirmText="Delete Task"
        cancelText="Cancel"
        isDangerous
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
};
