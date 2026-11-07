import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from '../components/layout/Sidebar';
import { AppHeader } from '../components/layout/AppHeader';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskService } from '../services/taskService';
import { useTheme } from '../contexts/ThemeContext';
import type { CreateTaskPayload, UpdateTaskPayload } from '../types/task';
import toast from 'react-hot-toast';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const { isDark } = useTheme();
  const location = useLocation();

  // Determine header title based on current route
  const getPageTitle = () => {
    if (location.pathname.startsWith('/dashboard')) return 'Dashboard Overview';
    if (location.pathname.startsWith('/tasks')) return 'Task Management';
    if (location.pathname.startsWith('/health')) return 'System Diagnostics';
    return 'TaskFlow Workspace';
  };

  const handleGlobalCreateTask = async (data: CreateTaskPayload | UpdateTaskPayload) => {
    setIsCreatingTask(true);
    try {
      await TaskService.createTask(data as CreateTaskPayload);
      toast.success('Task created successfully');
      setIsCreateModalOpen(false);
      // Trigger a custom event so child pages can re-fetch
      window.dispatchEvent(new CustomEvent('taskflow:task-created'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader
          title={getPageTitle()}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenCreateTask={() => setIsCreateModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Quick Create Task Modal */}
      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleGlobalCreateTask}
        isLoading={isCreatingTask}
      />

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'text-xs font-semibold',
          style: {
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
            border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
      />
    </div>
  );
};
