# TaskFlow — Modern Production-Grade Task Management Platform

TaskFlow is an enterprise-ready, full-stack TypeScript task management application. This repository is configured as a monorepo containing a Vite-powered React 19 frontend and an Express.js layered backend with Mongoose/MongoDB connectivity, strict type safety, secure HTTP-only cookie authentication, centralized error handling, and complete task management REST APIs.

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
│   │   ├── services/           # Centralized Axios client (apiClient, authService, taskService, dashboardService)
│   │   ├── types/              # Strict TypeScript definitions for domain, task, and API models
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
│   │   ├── controllers/        # Request/response handlers (auth.controller, task.controller, dashboard.controller, health.controller)
│   │   ├── middleware/         # Express middleware (auth, csrf, rateLimit, error, notFound, logger, validate)
│   │   ├── models/             # Mongoose schemas with pre-save hooks & indexes (user.model, task.model)
│   │   ├── routes/             # REST route declarations (auth.routes, task.routes, dashboard.routes, health.routes, index)
│   │   ├── services/           # Decoupled business logic (auth.service, task.service, dashboard.service, health.service)
│   │   ├── tests/              # Automated integration test suites (auth.test.ts, task.test.ts)
│   │   ├── types/              # Server-side TypeScript interfaces and Express augmentations
│   │   ├── utils/              # Cookie helpers, AppError, asyncHandler, logger, apiResponse
│   │   ├── validators/         # Zod request validation schemas (auth.validator, task.validator)
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

## 📋 Task Management Module (PROMPT 03)

### 1. Task Model & Indexes
Located at [`server/src/models/task.model.ts`](file:///d:/TaskFlow/server/src/models/task.model.ts):
- `title`: string (required, 1-200 chars, trimmed)
- `description`: string (optional, up to 2000 chars, default: `''`)
- `status`: `'pending' | 'in-progress' | 'completed'` (default: `'pending'`, indexed)
- `priority`: `'low' | 'medium' | 'high'` (default: `'medium'`, indexed)
- `dueDate`: Date (optional, indexed)
- `userId`: ObjectId reference to `User` (required, indexed)
- `createdAt` & `updatedAt`: Timestamps

**Compound Indexes for Optimal Query Performance:**
```ts
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, status: 1, dueDate: 1 });
taskSchema.index({ userId: 1, title: 1 });
```

---

### 2. API Endpoint Specification

All task and dashboard endpoints require authentication via HTTP-only cookie or Bearer token.

| Method | Endpoint | Description | Request Parameters / Body | Response Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/tasks` | Create task | Body: `{ title, description?, status?, priority?, dueDate? }` | `201 Created` |
| `GET` | `/api/tasks` | List tasks | Query: `search`, `status`, `priority`, `sortBy`, `order`, `page`, `limit` | `200 OK` + `meta` |
| `GET` | `/api/tasks/:id` | Get task by ID | Params: `id` (24-hex ObjectId) | `200 OK` |
| `PUT` | `/api/tasks/:id` | Edit task | Params: `id`, Body: `{ title?, description?, status?, priority?, dueDate? }` | `200 OK` |
| `PATCH` | `/api/tasks/:id/status` | Update status | Params: `id`, Body: `{ status: 'pending' \| 'in-progress' \| 'completed' }` | `200 OK` |
| `DELETE` | `/api/tasks/:id` | Delete task | Params: `id` (24-hex ObjectId) | `200 OK` |
| `GET` | `/api/dashboard/stats` | Dashboard stats | None | `200 OK` |

#### Example Query:
```http
GET /api/tasks?search=meeting&status=pending&priority=high&page=1&limit=10&sortBy=dueDate&order=asc
```

#### Pagination Metadata Envelope:
```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": { "tasks": [...] },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### Dashboard Statistics Payload (`GET /api/dashboard/stats`):
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "stats": {
      "total": 24,
      "pending": 10,
      "inProgress": 8,
      "completed": 6,
      "overdue": 3
    }
  }
}
```

---

### 3. Security & Multi-Tenant Data Isolation

1. **Authentication Enforcement**: Every task and dashboard route passes through [`auth.middleware.ts`](file:///d:/TaskFlow/server/src/middleware/auth.middleware.ts).
2. **UserId Trust Boundary**: `userId` is strictly extracted from `req.user.id` (derived from the validated JWT signature). Any `userId` supplied in request bodies is discarded.
3. **Cross-Tenant Isolation**: Queries and mutations explicitly enforce `{ _id: taskId, userId }`. If an authenticated user attempts to access, edit, or delete another user's task, the API responds with `404 Not Found`, completely preventing cross-user data leakage and ID enumeration.
4. **Input Validation**: All IDs are validated using a 24-character hexadecimal regex schema. Request bodies and query parameters are strictly parsed using Zod schemas in [`task.validator.ts`](file:///d:/TaskFlow/server/src/validators/task.validator.ts).

---

## 🧪 Automated Integration Test Suites

Run both test suites via:
```bash
npm run test
```

### 1. Task Management Test Suite (`npm run test:tasks`)
```text
====================================================
 Starting TaskFlow PROMPT 03 Task Management Tests
====================================================
  [PASS] 1. Reject Unauthenticated Access to Tasks API (HTTP 401)
  [PASS] 2. Create Task with Ownership & Ignore Spoofed userId
  [PASS] 3. Reject Invalid Task Payload via Zod Validation (HTTP 400)
  [PASS] 4. Retrieve Individual Task by ID (HTTP 200)
  [PASS] 5. Validate MongoDB ObjectId Format in Params (HTTP 400)
  [PASS] 6. Edit Task via PUT (HTTP 200)
  [PASS] 7. Update Task Status via PATCH (HTTP 200)
  [PASS] 8. Strict Multi-Tenant Data Isolation (No Cross-User Access)
  [PASS] 9. Title Search (Case-Insensitive Substring)
  [PASS] 10. Filter by Status (HTTP 200)
  [PASS] 11. Pagination with Accurate Metadata (page, limit, total, totalPages)
  [PASS] 12. Combined Search + Filter + Sort + Pagination Query
  [PASS] 13. Dashboard Statistics Calculation (Total, Statuses, Overdue)
  [PASS] 14. Dashboard Statistics Scoped to Authenticated User
  [PASS] 15. Delete Task and Confirm Removal (HTTP 200 -> 404)
----------------------------------------------------
 Total: 15 | Passed: 15 | Failed: 0
====================================================
```

### 2. Authentication Test Suite (`npm run test:auth`)
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

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run All Tests
```bash
npm run test
```

### 3. Run Development Servers Concurrently
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/v1/health`
