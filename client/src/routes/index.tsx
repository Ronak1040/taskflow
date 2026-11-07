import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { AppLayout } from '../layouts/AppLayout';
import { HomePage } from '../pages/HomePage';
import { HealthCheckPage } from '../pages/HealthCheckPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TasksPage } from '../pages/TasksPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { PublicRoute } from '../components/auth/PublicRoute';

export const router = createBrowserRouter([
  // Public marketing & auth layout
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'health',
        element: <HealthCheckPage />,
      },
      {
        path: 'login',
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        ),
      },
    ],
  },
  // Authenticated SaaS Dashboard & Task Management Workspace
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'tasks',
        element: <TasksPage />,
      },
    ],
  },
  // 404 Fallback
  {
    path: '*',
    element: <RootLayout />,
    children: [
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
