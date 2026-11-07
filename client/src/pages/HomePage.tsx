import React from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  Layers,
  ArrowRight,
  Database,
  Lock,
  Boxes,
  Cpu,
  ShieldCheck,
  KeyRound,
  LayoutDashboard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../contexts/AuthContext';

export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="info" size="md">
            PROMPT 01 • Architecture Foundation
          </Badge>
          <Badge variant="success" size="md">
            PROMPT 02 • Complete Authentication
          </Badge>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Enterprise Task Platform <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600">
            TaskFlow
          </span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Full-Stack TypeScript foundation with secure HTTP-only cookie authentication, bcrypt hashing, JWT validation, and layered Express architecture.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="lg" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
                Go to Workspace Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Create Free Account
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Sign In
                </Button>
              </Link>
            </>
          )}
          <Link to="/health">
            <Button variant="outline" size="lg" leftIcon={<Server className="w-4 h-4" />}>
              Diagnostics
            </Button>
          </Link>
        </div>
      </div>

      {/* Authentication & Security Banner */}
      <Card className="border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Production-Grade Authentication Active
                  </h3>
                  <Badge variant="success">HTTP-Only Cookies</Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isAuthenticated
                    ? `Logged in as ${user?.name} (${user?.email}) • Session verified`
                    : 'Stateless JWT with HTTP-only cookies • Zero localStorage token leakage • CSRF protected'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button size="sm" variant="secondary">Open Dashboard</Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button size="sm">Register Now</Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Architecture Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frontend Architecture */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-brand-600" />
                <CardTitle>Frontend Architecture</CardTitle>
              </div>
              <Badge variant="info">React 19 + Vite</Badge>
            </div>
            <CardDescription>
              Client application organized by clean modular layers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'components/', desc: 'Atomic UI (Button, Card, Badge, Header, Footer) & ProtectedRoute' },
              { name: 'pages/', desc: 'Views (HomePage, LoginPage, RegisterPage, DashboardPage, HealthCheck)' },
              { name: 'layouts/', desc: 'RootLayout with responsive navigation and theme-aware Toast notifications' },
              { name: 'contexts/', desc: 'AuthContext (HTTP-only session hydration) & ThemeContext' },
              { name: 'hooks/', desc: 'Reactive hooks (useHealth for live telemetry)' },
              { name: 'services/', desc: 'Axios apiClient with withCredentials: true & authService' },
              { name: 'types/', desc: 'Strict TypeScript interfaces for API contracts and domain models' },
              { name: 'utils/', desc: 'Class mergers (cn), formatters, date/uptime helpers' },
            ].map((item) => (
              <div key={item.name} className="flex items-start space-x-2.5 text-xs">
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-mono font-medium">
                  {item.name}
                </code>
                <span className="text-slate-600 dark:text-slate-400">{item.desc}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Backend Architecture */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <CardTitle>Backend Architecture</CardTitle>
              </div>
              <Badge variant="info">Node.js + Express</Badge>
            </div>
            <CardDescription>
              Layered service architecture with strict validation and error handling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'config/', desc: 'Zod-validated env config & Mongoose connection lifecycle manager' },
              { name: 'controllers/', desc: 'Auth controller (register, login, logout, getMe) & health controller' },
              { name: 'services/', desc: 'AuthService (bcrypt comparison, user lookup) & HealthService' },
              { name: 'models/', desc: 'User model with indexed email, bcrypt pre-save hook, safe JSON' },
              { name: 'routes/', desc: 'REST hierarchy: /api/auth/* & /api/v1/health' },
              { name: 'middleware/', desc: 'Cookie JWT auth middleware, CSRF shield, rate limiter, error handler' },
              { name: 'validators/', desc: 'Zod schemas validating registration & login inputs' },
              { name: 'utils/', desc: 'Cookie helpers, AppError, asyncHandler, ApiResponse envelope, logger' },
            ].map((item) => (
              <div key={item.name} className="flex items-start space-x-2.5 text-xs">
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                  {item.name}
                </code>
                <span className="text-slate-600 dark:text-slate-400">{item.desc}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Engineering Standards Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <KeyRound className="w-5 h-5 text-blue-500" />,
            title: 'HTTP-Only Cookies',
            desc: 'JWT stored strictly in httpOnly cookies, immune to JavaScript XSS theft.',
          },
          {
            icon: <Database className="w-5 h-5 text-emerald-500" />,
            title: 'Bcrypt Hashing',
            desc: 'Passwords salted with 12 rounds; hash never exposed in API payloads.',
          },
          {
            icon: <Lock className="w-5 h-5 text-amber-500" />,
            title: 'Security Hardened',
            desc: 'CSRF origin & header checks, brute-force rate limiting, user enumeration defense.',
          },
          {
            icon: <Cpu className="w-5 h-5 text-purple-500" />,
            title: 'Persistent Session',
            desc: 'Automatic session validation on page refresh via GET /api/auth/me.',
          },
        ].map((standard, i) => (
          <Card key={i} className="hover:border-slate-300 dark:hover:border-slate-700">
            <CardContent className="p-5 space-y-2">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit">
                {standard.icon}
              </div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                {standard.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {standard.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
