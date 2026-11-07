# TaskFlow — Modern Production-Grade Task Management Platform

TaskFlow is an enterprise-ready, full-stack TypeScript task management application. This repository is configured as a monorepo containing a Vite-powered React 19 frontend and an Express.js layered backend with Mongoose/MongoDB connectivity, strict type safety, secure HTTP-only cookie authentication, centralized error handling, and runtime diagnostics.

---

## 🏛️ Monorepo Architecture Overview

```text
taskflow/
├── client/                     # Frontend Application (React 19 + Vite + Tailwind CSS)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable atomic UI & auth components
│   │   │   ├── auth/           # ProtectedRoute component
│   │   │   └── common/         # Button, Card, Badge, Header, Footer
│   │   ├── contexts/           # React context providers (AuthContext, ThemeContext)
│   │   ├── hooks/              # Custom reactive hooks (useHealth for live system telemetry)
│   │   ├── layouts/            # Application shells and root routing layouts (RootLayout)
│   │   ├── pages/              # View pages (HomePage, LoginPage, RegisterPage, DashboardPage, HealthCheckPage, NotFoundPage)
│   │   ├── routes/             # React Router v7 configuration
│   │   ├── services/           # Centralized Axios client with withCredentials & authService
│   │   ├── types/              # Strict TypeScript definitions for domain and API models
│   │   ├── utils/              # Pure utility functions (formatting, class mergers)
│   │   ├── App.tsx             # Root component with AuthProvider & ThemeProvider
│   │   ├── index.css           # Tailwind CSS directives and root theme variables
│   │   └── main.tsx            # Application DOM entry point
│   ├── .env.example            # Client environment variables blueprint
│   ├── index.html              # HTML shell
│   ├── package.json            # Client package dependencies & scripts
│   ├── postcss.config.js       # PostCSS plugins (Tailwind, Autoprefixer)
│   ├── tailwind.config.js      # Tailwind CSS configuration with brand design system
│   ├── tsconfig.json           # Client TypeScript project references
│   ├── tsconfig.app.json       # Strict TypeScript app compiler configuration
│   └── vite.config.ts          # Vite build configuration with alias '@' mapping
│
├── server/                     # Backend Application (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/             # Zod-validated environment config and Mongoose database connector
│   │   ├── controllers/        # Request/response handlers (auth.controller, health.controller)
│   │   ├── middleware/         # Express middleware (auth, csrf, rateLimit, error, notFound, logger, validate)
│   │   ├── models/             # Mongoose schemas with pre-save hooks (user.model)
│   │   ├── routes/             # REST route declarations (auth.routes, health.routes, index)
│   │   ├── services/           # Decoupled business logic (auth.service, health.service)
│   │   ├── tests/              # Automated test suite (auth.test.ts)
│   │   ├── types/              # Server-side TypeScript interfaces and Express augmentations
│   │   ├── utils/              # Cookie helpers, AppError, asyncHandler, logger, apiResponse
│   │   ├── validators/         # Zod request validation schemas (auth.validator)
│   │   ├── app.ts              # Express application factory with middleware pipeline
│   │   └── index.ts            # Entry point establishing DB and listening on HTTP port
│   ├── .env.example            # Server environment variables blueprint
│   ├── package.json            # Server dependencies & scripts
│   └── tsconfig.json           # Strict NodeNext TypeScript configuration
│
├── .gitignore                  # Monorepo git ignore rules
├── .npmrc                      # NPM configuration
├── package.json                # Root package workspace scripts (concurrent execution)
└── README.md                   # System documentation
```

---

## 🔐 Complete Authentication System (PROMPT 02)

TaskFlow implements a robust, enterprise-grade authentication system adhering to OWASP recommendations:

### 1. Security & Storage Design
- **Zero Client Token Storage**: JWT is **never** stored in `localStorage` or `sessionStorage`, eliminating exposure to Cross-Site Scripting (XSS) token theft.
- **HTTP-Only Cookies**: Tokens are issued via standard `Set-Cookie` with:
  - `httpOnly: true` (inaccessible to browser JavaScript)
  - `secure: true` in production (enforced over HTTPS)
  - `sameSite: 'lax'` (prevents cross-site cookie leakage on third-party origins)
  - `maxAge: 7 days`
- **CSRF Mitigation**: Custom `X-Requested-With: XMLHttpRequest` header check coupled with Origin validation for state-changing HTTP methods.
- **Brute-Force Rate Limiting**: `express-rate-limit` throttles authentication endpoints (`/api/auth/register` and `/api/auth/login`) to 20 attempts per 15 minutes per IP.
- **User Enumeration Prevention**: Consistent generic error responses (`"Invalid email or password."`) on login failures whether the email exists or not.
- **Salted Password Hashing**: Passwords hashed using `bcryptjs` with 12 salt rounds in a Mongoose pre-save hook.
- **Sensitive Field Protection**: Password hashes are stripped via `select: false` on the User schema and sanitized during JSON serialization.

### 2. API Contract Specification

| Method | Endpoint | Description | Auth Required | Request Body | Response Envelope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Registers a new user account & sets HTTP-only cookie | No | `{ name, email, password }` | `{ success: true, data: { user } }` (201) |
| `POST` | `/api/auth/login` | Authenticates user & sets HTTP-only cookie | No | `{ email, password }` | `{ success: true, data: { user } }` (200) |
| `POST` | `/api/auth/logout` | Clears authentication cookie | No | None | `{ success: true, message: "Logout successful" }` (200) |
| `GET` | `/api/auth/me` | Fetches current user profile from cookie session | **Yes** | None | `{ success: true, data: { user } }` (200) |
| `GET` | `/api/v1/health` | Health telemetry and MongoDB status | No | None | `{ success: true, data: { status, services, ... } }` (200) |

---

## 🧪 Automated Test Suite Results

A dedicated automated test suite (`server/src/tests/auth.test.ts`) verifies all authentication endpoints:

```text
====================================================
 Starting TaskFlow PROMPT 02 Authentication Test Suite
====================================================
  [PASS] 1. User Registration (Success + HTTP-Only Cookie)
  [PASS] 2. Prevent Duplicate Email Registration
  [PASS] 3. Reject Invalid/Weak Credentials with Zod Validation
  [PASS] 4. User Login (Success + HTTP-Only Cookie)
  [PASS] 5. Reject Invalid Password (Anti-Enumeration)
  [PASS] 6. Reject Unauthenticated Access to /api/auth/me
  [PASS] 7. Persistent Session Verification via /api/auth/me
  [PASS] 8. Logout (Cookie Cleared)
  [PASS] 9. System Health Check Endpoint (HTTP 200)
----------------------------------------------------
 Total: 9 | Passed: 9 | Failed: 0
====================================================
```

To run the test suite at any time:
```bash
npm run test:auth
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Both Services Concurrently
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/v1/health` or `http://localhost:5000/health`

### 3. Individual Service Commands
```bash
# Backend development with live reload
npm run dev:server

# Frontend development server
npm run dev:client

# Type-check both workspaces
npm run typecheck

# Build both applications for production
npm run build
```

---

## 🖥️ Frontend User Interface Pages

- **Home Page (`/`)**: Architecture showcase, security summary, and live telemetry.
- **Register Page (`/register`)**: Account creation with real-time password strength requirements and instant validation feedback.
- **Login Page (`/login`)**: Secure sign-in with show/hide password toggle and redirection to intended routes.
- **Dashboard (`/dashboard`)**: Protected route displaying user profile attributes, session verification badges, and workspace preview.
- **Diagnostics (`/health`)**: Diagnostic inspection panel for real-time memory, platform, database status, and API round-trip latency.
- **404 Page (`*`)**: Graceful route recovery.
