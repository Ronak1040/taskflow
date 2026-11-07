import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Component imports
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { PublicRoute } from '../components/auth/PublicRoute';
import { TaskModal } from '../components/tasks/TaskModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { AuthProvider } from '../contexts/AuthContext';
import { AuthService } from '../services/authService';
import type { Task } from '../types/task';
import type { User } from '../types/auth';

// Mock dependencies
vi.mock('../services/authService', () => ({
  AuthService: {
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TaskFlow Frontend QA Test Battery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. LOGIN FORM VALIDATION & INTERACTIONS
  // =========================================================================
  describe('Login Form Validation & Interactions', () => {
    it('1. Renders login form fields correctly', async () => {
      vi.mocked(AuthService.getMe).mockRejectedValueOnce(new Error('Unauthenticated'));

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('2. Rejects submission with empty inputs and displays client-side validation error', async () => {
      vi.mocked(AuthService.getMe).mockRejectedValueOnce(new Error('Unauthenticated'));

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      const submitBtn = screen.getByRole('button', { name: /Sign In/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(
        await screen.findByText(/Please fill in both email and password/i)
      ).toBeInTheDocument();
      expect(AuthService.login).not.toHaveBeenCalled();
    });

    it('3. Successfully submits valid credentials to login API', async () => {
      const user = userEvent.setup();
      vi.mocked(AuthService.getMe).mockRejectedValueOnce(new Error('Unauthenticated'));
      const mockUser: User = {
        id: '123',
        name: 'Jane Doe',
        email: 'jane@taskflow.dev',
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(AuthService.login).mockResolvedValueOnce(mockUser);

      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/login']}>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      await user.type(screen.getByLabelText(/Email Address/i), 'jane@taskflow.dev');
      await user.type(screen.getByLabelText(/Password/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalledWith({
          email: 'jane@taskflow.dev',
          password: 'Password123!',
        });
      });
    });
  });

  // =========================================================================
  // 2. REGISTRATION FORM VALIDATION
  // =========================================================================
  describe('Registration Form Validation', () => {
    it('4. Enforces password security rules and password match validation', async () => {
      const user = userEvent.setup();
      vi.mocked(AuthService.getMe).mockRejectedValueOnce(new Error('Unauthenticated'));

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <RegisterPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      // Fill in weak password
      await user.type(screen.getByLabelText(/Full Name/i), 'New User');
      await user.type(screen.getByLabelText(/Email Address/i), 'newuser@taskflow.dev');
      await user.type(screen.getByLabelText(/^Password/i), 'short');
      await user.type(screen.getByLabelText(/Confirm Password/i), 'mismatch');

      const submitBtn = screen.getByRole('button', { name: /Create Account/i });
      await user.click(submitBtn);

      expect(
        await screen.findByText(/Password does not meet the security criteria/i)
      ).toBeInTheDocument();
      expect(AuthService.register).not.toHaveBeenCalled();

      // Fix complexity but keep mismatch
      await user.clear(screen.getByLabelText(/^Password/i));
      await user.type(screen.getByLabelText(/^Password/i), 'ValidPass123!');
      await user.click(submitBtn);

      const mismatchTexts = await screen.findAllByText(/Passwords do not match/i);
      expect(mismatchTexts.length).toBeGreaterThan(0);
      expect(AuthService.register).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. PROTECTED ROUTES & AUTHENTICATION STATE
  // =========================================================================
  describe('Protected Routes & Authentication State', () => {
    it('5. Redirects unauthenticated users away from protected routes to /login', async () => {
      vi.mocked(AuthService.getMe).mockRejectedValueOnce(new Error('Unauthorized'));

      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/dashboard']}>
            <AuthProvider>
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <div data-testid="dashboard-content">Secret Dashboard</div>
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<div data-testid="login-content">Login Page</div>} />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        );
      });

      // Verify dashboard content is NOT rendered and redirected to login
      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
        expect(screen.getByTestId('login-content')).toBeInTheDocument();
      });
    });

    it('6. Allows authenticated users to access protected routes', async () => {
      const mockUser: User = {
        id: '123',
        name: 'Authenticated User',
        email: 'auth@taskflow.dev',
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(AuthService.getMe).mockResolvedValueOnce(mockUser);

      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/dashboard']}>
            <AuthProvider>
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <div data-testid="dashboard-content">Secret Dashboard</div>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });
    });

    it('7. PublicRoute redirects authenticated users away from /login to /dashboard', async () => {
      const mockUser: User = {
        id: '123',
        name: 'Authenticated User',
        email: 'auth@taskflow.dev',
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(AuthService.getMe).mockResolvedValueOnce(mockUser);

      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/login']}>
            <AuthProvider>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <div data-testid="guest-login">Login Form</div>
                    </PublicRoute>
                  }
                />
                <Route path="/dashboard" element={<div data-testid="dashboard-dest">Dashboard Home</div>} />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        );
      });

      await waitFor(() => {
        expect(screen.queryByTestId('guest-login')).not.toBeInTheDocument();
        expect(screen.getByTestId('dashboard-dest')).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // 4. TASK CREATION FORM & EDITING
  // =========================================================================
  describe('Task Creation & Editing Modal', () => {
    it('8. Enforces client-side validation on task creation (Title required)', async () => {
      const handleSubmit = vi.fn();

      render(
        <TaskModal
          isOpen={true}
          onClose={() => {}}
          onSubmit={handleSubmit}
          isLoading={false}
        />
      );

      const submitBtn = screen.getByRole('button', { name: /Create Task/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/Task title is required/i)).toBeInTheDocument();
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('9. Pre-populates TaskModal with existing data during editing and submits changes', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn().mockResolvedValue(undefined);
      const existingTask: Task = {
        id: 'task-100',
        title: 'Initial Title',
        description: 'Initial Description',
        status: 'pending',
        priority: 'high',
        dueDate: '2026-12-01T00:00:00.000Z',
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(
        <TaskModal
          isOpen={true}
          onClose={() => {}}
          onSubmit={handleSubmit}
          taskToEdit={existingTask}
          isLoading={false}
        />
      );

      expect(screen.getByDisplayValue('Initial Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Initial Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();

      // Modify title
      const titleInput = screen.getByDisplayValue('Initial Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title Spec');

      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title Spec',
          priority: 'high',
          status: 'pending',
        })
      );
    });
  });

  // =========================================================================
  // 5. DELETE CONFIRMATION DIALOG
  // =========================================================================
  describe('Confirm Dialog (Destructive Actions)', () => {
    it('10. Renders confirmation dialog, supports cancellation and confirmation actions', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const { rerender } = render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Task"
          message="Are you sure you want to delete this task permanently?"
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText(/Delete Task/i)).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete this task permanently\?/i)).toBeInTheDocument();

      // Click cancel
      await user.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();

      // Click confirm
      await user.click(screen.getByRole('button', { name: /Delete/i }));
      expect(onConfirm).toHaveBeenCalledTimes(1);

      // When closed, nothing renders
      rerender(
        <ConfirmDialog
          isOpen={false}
          title="Delete Task"
          message="Are you sure you want to delete this task permanently?"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );
      expect(screen.queryByText(/Delete Task/i)).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 6. LOADING, ERROR, AND EMPTY STATES
  // =========================================================================
  describe('State Displays (Loading, Empty, Error)', () => {
    it('11. LoadingState renders skeleton cards and spinner modes', () => {
      // 11a. Skeleton mode
      const { container, rerender } = render(<LoadingState type="skeleton" rows={3} />);
      expect(container.querySelectorAll('.h-16')).toHaveLength(3);

      // 11b. Spinner mode
      rerender(<LoadingState type="spinner" message="Fetching telemetry..." />);
      expect(screen.getByText(/Fetching telemetry.../i)).toBeInTheDocument();
    });

    it('12. EmptyState renders messaging and triggers CTA callback', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();

      render(
        <EmptyState
          icon={<span data-testid="empty-icon">Icon</span>}
          title="No tasks found"
          description="You do not have any tasks in this view."
          actionText="Add New Task"
          onAction={onAction}
        />
      );

      expect(screen.getByText(/No tasks found/i)).toBeInTheDocument();
      expect(screen.getByText(/You do not have any tasks in this view/i)).toBeInTheDocument();

      const ctaBtn = screen.getByRole('button', { name: /Add New Task/i });
      await user.click(ctaBtn);
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });
});
