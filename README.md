# TaskFlow — Modern Production-Grade Task Management Platform

TaskFlow is an enterprise-ready, full-stack TypeScript task management application. This repository is configured as a monorepo containing a Vite-powered React 19 frontend and an Express.js layered backend with Mongoose/MongoDB connectivity, strict type safety, secure HTTP-only cookie authentication, centralized error handling, and complete task management REST APIs.

---

## 🏛️ Monorepo Architecture Overview

```text
taskflow/
├── client/                     # Frontend Application (React 19 + Vite + Tailwind CSS)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable atomic UI & domain components
│   │   │   ├── auth/           # ProtectedRoute component
│   │   │   ├── common/         # Button, Card, Badge, Header, Footer, StatCard, SearchBar, FilterDropdown,
│   │   │   │                   # StatusBadge, PriorityBadge, EmptyState, LoadingState, ConfirmDialog
│   │   │   ├── layout/         # AppHeader, Sidebar (collapsible SaaS navigation)
│   │   │   └── tasks/          # TaskCard, TaskTable, TaskModal (create/edit form)
│   │   ├── contexts/           # React context providers (AuthContext, ThemeContext)
│   │   ├── hooks/              # Custom reactive hooks (useHealth for live system telemetry)
│   │   ├── layouts/            # Application shells (RootLayout for public/auth, AppLayout for workspace)
│   │   ├── pages/              # View pages (HomePage, LoginPage, RegisterPage, DashboardPage, TasksPage, HealthCheckPage, NotFoundPage)
│   │   ├── routes/             # React Router v7 configuration with protected app routes
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

## 🎨 Modern SaaS Frontend UI Architecture (PROMPT 04)

TaskFlow features a clean, responsive, SaaS-style user interface built with React 19, Tailwind CSS, TypeScript, and Lucide React icons. It connects directly to the real backend APIs created in Prompts 01–03.

### 1. Design Direction & Aesthetic Guidelines
- **Modern SaaS Dashboard**: Minimalist, professional interface optimized for task readability and operational velocity.
- **Palette & Typography**: Light slate background (`bg-slate-50`), crisp white surface cards (`bg-white`), dark navy text (`text-slate-900`), and dark mode support (`dark:bg-slate-950`).
- **Surfaces & Borders**: Subtle borders (`border-slate-200/80`), gentle soft shadows (`shadow-2xs`, `shadow-xs`), and rounded containers (`rounded-xl`, `rounded-2xl`).
- **No Gradients / Clutter**: Zero unnecessary animations or garish gradients; focused strictly on UX clarity, accessibility, and high information density.

---

### 2. Page Directory & Features

| Route | Page Component | Access | Key Features |
| :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | Public | Email and password authentication, inline validation, loading states, direct redirect to `/dashboard`. |
| `/register` | `RegisterPage` | Public | Name, email, password, and password confirmation with client-side match validation. |
| `/dashboard` | `DashboardPage` | Authenticated | Live stats cards (Total, In Progress, Pending, Completed, Overdue), sprint progress metric, recent tasks feed, upcoming deadlines list, quick-complete action. |
| `/tasks` | `TasksPage` | Authenticated | Multi-view task management (Data Table vs Grid Cards), debounced search, status filter, priority filter, sort by due date / title / priority / created date, pagination, create/edit modal, delete confirmation. |
| `/health` | `HealthCheckPage` | Public | Live backend connectivity and system telemetry monitor. |

---

### 3. Modular Reusable UI Components

Located in [`client/src/components/`](file:///d:/TaskFlow/client/src/components):

- **Layout Components**:
  - `AppLayout`: SaaS layout shell integrating collapsible sidebar, app header, global task modal, and toasts.
  - `Sidebar`: Collapsible sidebar navigation with active route highlights, team/workspace badge, user profile drawer, and quick logout.
  - `AppHeader`: Header featuring hamburger toggle, dynamic page titles, theme toggle, and "+ New Task" trigger.
- **Data & Metric Displays**:
  - `StatCard`: KPI card displaying metric value, icon pill, and descriptive trend subtitle.
  - `StatusBadge`: Semantic status pills with icons (`pending` = amber, `in-progress` = sky, `completed` = emerald).
  - `PriorityBadge`: Indicator with colored dot (`low` = slate, `medium` = amber, `high` = rose).
- **Task Management Components**:
  - `TaskCard`: Visual card view with status dropdown, overdue indicators, formatted dates, and action menus.
  - `TaskTable`: High-density responsive data table with column headers, formatted timestamps, and inline action buttons.
  - `TaskModal`: Accessible modal dialog for creating and editing tasks with real-time validation and ISO date conversion.
  - `ConfirmDialog`: Danger-themed confirmation dialog protecting against accidental task deletions.
- **Filter & Search Controls**:
  - `SearchBar`: Responsive search input with Lucide search icon and instant clear button.
  - `FilterDropdown`: Generalized select dropdown for status, priority, and sort options.
- **State Fallbacks**:
  - `LoadingState`: Dual-mode skeleton card grid or spinner loading indicators.
  - `EmptyState`: Contextual illustration and messaging with action call-to-action button.

---

### 4. Client-Side API Integration & State Synchronization
- **Zero Mock Statistics**: Dashboard metrics and task lists are fetched live from `GET /api/dashboard/stats` and `GET /api/tasks`.
- **Global Event Synchronization**: Quick-task creation from the top header dispatches a lightweight custom event (`taskflow:task-created`), automatically updating active views and statistics without requiring a page refresh.
- **Secure Sessions**: Token handling is purely cookie-based with `withCredentials: true`; no JWTs are saved in `localStorage` or `sessionStorage`.

---

## ⚡ Full-Stack Integration (PROMPT 05)

TaskFlow features complete end-to-end integration between the React 19 frontend and Express / MongoDB backend with strict security, responsive state management, and real-time event synchronization.

### 1. Authentication Integration
- **Persistent Session Restoration**: On initial application load, `AuthContext` calls `GET /api/auth/me` using HTTP-only cookies (`withCredentials: true`). If valid, user state is hydrated; otherwise, guest mode is established cleanly.
- **Session Expiration & 401 Interception**: The centralized Axios interceptor intercepts `401 Unauthorized` responses on authenticated endpoints and broadcasts `taskflow:session-expired`, prompting `AuthContext` to clear the user session and notify the user via a toast.
- **Route Access Controls**:
  - `ProtectedRoute`: Guards `/dashboard` and `/tasks`, redirecting unauthenticated visitors to `/login` with location memory.
  - `PublicRoute`: Guards `/login` and `/register`, redirecting already authenticated users to `/dashboard`.
- **403 Forbidden & CSRF Shield**: State-changing operations require `X-Requested-With: XMLHttpRequest` and validate Origin against the whitelist.

---

### 2. Task Integration & Real-Time Reactivity
- **Debounced Search**: The search input features a 350ms debounce timer, eliminating duplicate intermediary API requests while typing.
- **Unified Cross-Component Synchronization**: Any task mutation (create, edit, delete, status toggle) triggers a lightweight custom event (`taskflow:task-changed`), ensuring that `DashboardPage` metric cards, progress bars, upcoming deadlines, and `TasksPage` tables remain in sync without stale data or manual browser refresh.
- **Duplicate Request & Double-Submission Prevention**: All modals and actions bind to `isSubmitting` / `isDeleting` states to disable double-clicking or duplicate submissions.
- **Full Filter & Sorting Synergy**: Search queries, status filters, priority filters, sort keys, sort orders, and page offsets operate concurrently on the backend MongoDB aggregation pipeline.

---

### 3. End-to-End Acceptance Test Results (`npm run test:e2e`)

```text
====================================================
 END-TO-END WORKFLOW TEST RESULTS
====================================================
  [PASS] 1. Register a new account (HTTP 201 + Secure HTTP-only cookie)
  [PASS] 2. Log in with credentials (HTTP 200 + Session established)
  [PASS] 3. Create a task (HTTP 201 + Dashboard stats updated)
  [PASS] 4. Edit the task (HTTP 200 + Record updated in DB)
  [PASS] 5. Change task status (HTTP 200 + DB persistence + Stat reactivity)
  [PASS] 6. Filter and search tasks (Search, filters, sort, and pagination work together)
  [PASS] 7. Delete the task (HTTP 200 + DB removal + HTTP 404 verification)
  [PASS] 8. Log out (HTTP 200 + Cookie cleared + Subsequent unauthenticated calls return 401)
  [PASS] 9. Log in again and verify session restoration (/api/auth/me returns valid user)
  [PASS] 10. Cross-Tenant Data Isolation (Zero unauthorized cross-user access, strict 404)
----------------------------------------------------
 Total: 10 | Passed: 10 | Failed: 0
====================================================
```

**Total Integration Test Battery: 34 / 34 Tests Passed (100% Pass Rate)**
- Authentication Test Suite: 9 / 9
- Task Management Test Suite: 15 / 15
- Full-Stack E2E Workflow Test Suite: 10 / 10

---

## 🛡️ Quality Assurance, Automated Testing & Security Review (PROMPT 06)

TaskFlow includes an exhaustive automated test battery across backend APIs and frontend UI components, accompanied by a comprehensive security audit and code quality pipeline.

### 1. Test Architecture & Framework Setup
- **Backend Testing Framework**: Vitest + Supertest + MongoMemoryServer (isolated ephemeral in-memory database).
- **Frontend Testing Framework**: Vitest + React Testing Library + JSDOM + `@testing-library/jest-dom`.
- **Linter & Code Quality**: ESLint 9 (Flat Config) + `@typescript-eslint` + Strict TypeScript (`tsc`).

### 2. Automated Test Battery Matrix (67 Tests, 100% Passing)

#### A. Backend QA & Security Test Battery (`npm run test:qa:server` / `backend.qa.spec.ts`)
| ID | Area | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Auth | Successful user registration | Returns 201, sets `httpOnly` cookie, excludes password hash | **PASS** |
| 2 | Auth | Prevent duplicate email registration | Returns 409 Conflict with informative error | **PASS** |
| 3 | Auth | Reject invalid email format | Returns 400 Bad Request via Zod email validation | **PASS** |
| 4 | Auth | Reject weak passwords | Returns 400 Bad Request (enforces 8+ chars, upper, lower, number) | **PASS** |
| 5 | Auth | Successful login with valid credentials | Returns 200 OK and establishes authenticated session cookie | **PASS** |
| 6 | Auth | Reject invalid password | Returns 401 Unauthorized with anti-enumeration message | **PASS** |
| 7 | Auth | Missing authentication on protected route | Returns 401 Unauthorized | **PASS** |
| 8 | Auth | Reject invalid and expired tokens | Returns 401 Unauthorized for malformed or expired JWTs | **PASS** |
| 9 | Auth | Logout clears session cookie | Returns 200 OK and clears `taskflow_token` cookie | **PASS** |
| 10 | Tasks | Create task with full metadata | Returns 201 Created and associates task with authenticated user | **PASS** |
| 11 | Tasks | Get tasks with pagination | Returns 200 OK with paginated array and accurate metadata | **PASS** |
| 12 | Tasks | Get task by ID | Returns 200 OK with single task document | **PASS** |
| 13 | Tasks | Update task via PUT | Returns 200 OK with updated attributes persisted | **PASS** |
| 14 | Tasks | Delete task removes from database | Returns 200 OK; subsequent fetch returns 404 Not Found | **PASS** |
| 15 | Tasks | Reject invalid MongoDB ObjectId format | Returns 400 Bad Request on invalid 24-hex string | **PASS** |
| 16 | Tasks | Reject invalid task payload data | Returns 400 Bad Request on empty title or invalid enum | **PASS** |
| 17 | Tasks | Unauthorized task access without session | Returns 401 Unauthorized | **PASS** |
| 18 | Tasks | Strict cross-user task access isolation | User B attempting to read, update, or delete User A's task returns 404 | **PASS** |
| 19 | Tasks | Search and filter synergy | Search, status, and priority query filters execute concurrently | **PASS** |
| 20 | Tasks | Pagination metadata boundaries | Verifies `page`, `limit`, `total`, `totalPages`, `hasNextPage`, `hasPrevPage` | **PASS** |
| 21 | Dashboard | Dashboard statistics aggregation | Correctly aggregates total, pending, in-progress, completed, and overdue | **PASS** |

#### B. Frontend QA & Interaction Test Battery (`npm run test:qa:client` / `frontend.qa.spec.tsx`)
| ID | Component / Area | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `LoginPage` | Form field rendering | Email, password, and submit button rendered with accessibility labels | **PASS** |
| 2 | `LoginPage` | Empty inputs validation | Rejects submission and displays error message | **PASS** |
| 3 | `LoginPage` | Valid submission | Triggers `authService.login` with sanitized credentials | **PASS** |
| 4 | `RegisterPage` | Password security & match rules | Enforces complexity and password mismatch verification | **PASS** |
| 5 | `ProtectedRoute` | Unauthenticated route guard | Redirects unauthenticated users from `/dashboard` to `/login` | **PASS** |
| 6 | `ProtectedRoute` | Authenticated route access | Allows authenticated users to view protected views | **PASS** |
| 7 | `PublicRoute` | Public route reverse guard | Redirects authenticated users from `/login` to `/dashboard` | **PASS** |
| 8 | `TaskModal` | Client-side validation | Enforces required title and character limits before submit | **PASS** |
| 9 | `TaskModal` | Edit pre-population & submission | Pre-fills existing task attributes and submits updated payload | **PASS** |
| 10 | `ConfirmDialog` | Destructive action confirmation | Supports cancellation and triggers callback on confirmation | **PASS** |
| 11 | `LoadingState` | Loading state variants | Renders skeleton card grids and spinner modes | **PASS** |
| 12 | `EmptyState` | Empty state & CTA | Displays contextual illustration, copy, and action button | **PASS** |

#### C. Standalone End-to-End & REST Suites (`npm test`)
- **Authentication Standalone Suite** (`auth.test.ts`): 9 / 9 passed.
- **Task Management REST Suite** (`task.test.ts`): 15 / 15 passed.
- **Full-Stack Workflow E2E Suite** (`e2e.integration.test.ts`): 10 / 10 passed.

---

### 3. Comprehensive Security Review Summary

| Security Domain | Implementation Details | Verdict |
| :--- | :--- | :--- |
| **Password Hashing** | Bcrypt with 12 salt rounds; pre-save hooks prevent double hashing | **SECURE** |
| **Token Handling** | JWT with HS256, 7-day expiration, signed with secret from env | **SECURE** |
| **Cookie Security** | `httpOnly: true`, `sameSite: 'lax'`, `secure: true` in production | **SECURE** |
| **CSRF Defense** | Enforces `X-Requested-With: XMLHttpRequest` and Origin header checks | **SECURE** |
| **CORS Policy** | Restricted to authorized frontend origins (`CLIENT_URL`); rejects arbitrary origins | **SECURE** |
| **Tenant Isolation** | Every database operation strictly scopes `userId` from verified JWT identity | **SECURE** |
| **Input Validation** | Strict Zod schemas sanitize all request bodies, params, and query strings | **SECURE** |
| **Anti-Enumeration** | Identical generic error message (`Invalid email or password`) on failed logins | **SECURE** |
| **Information Leakage** | Password hashes stripped via `toJSON` transform; zero sensitive data in responses | **SECURE** |
| **Rate Limiting** | Tiered rate limiters protect auth endpoints from brute-force attempts | **SECURE** |

---

### 4. Code Quality & Build Verification Commands

```bash
# 1. Run strict TypeScript typecheck (zero errors)
npm run typecheck

# 2. Run ESLint across frontend and backend (zero errors)
npm run lint

# 3. Run full automated test battery (67 / 67 passing)
npm run test:all

# 4. Run production builds for server and client
npm run build
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
