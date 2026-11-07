import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Task } from '../models/task.model.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTaskTestSuite() {
  console.log('====================================================');
  console.log(' Starting TaskFlow PROMPT 03 Task Management Tests');
  console.log('====================================================\n');

  let server: any;
  let baseUrl = '';

  try {
    // 1. Database Connection
    await connectDB();

    // Clean test data
    await User.deleteMany({ email: { $in: ['taskuser1@taskflow.dev', 'taskuser2@taskflow.dev'] } });
    await Task.deleteMany({});

    // 2. Start HTTP server on dynamic port
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        const port = typeof address === 'string' ? address : address.port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    console.log(`Test server running at ${baseUrl}\n`);

    // --- SETUP: Register User 1 & User 2 ---
    const regUser1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ name: 'User One', email: 'taskuser1@taskflow.dev', password: 'Password123!' }),
    });
    const cookieUser1 = (regUser1.headers.get('set-cookie') || '').split(';')[0];
    const user1Data = (await regUser1.json()).data.user;

    const regUser2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ name: 'User Two', email: 'taskuser2@taskflow.dev', password: 'Password123!' }),
    });
    const cookieUser2 = (regUser2.headers.get('set-cookie') || '').split(';')[0];
    const user2Data = (await regUser2.json()).data.user;

    assert(Boolean(cookieUser1 && cookieUser2), 'Failed to register test users');

    let createdTaskId = '';

    // TEST 1: Reject unauthenticated access
    try {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      assert(res.status === 401, `Expected status 401, got ${res.status}`);
      results.push({ name: '1. Reject Unauthenticated Access to Tasks API (HTTP 401)', passed: true });
    } catch (err: any) {
      results.push({ name: '1. Reject Unauthenticated Access to Tasks API (HTTP 401)', passed: false, error: err.message });
    }

    // TEST 2: Create a task (User 1)
    try {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          Cookie: cookieUser1,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          title: 'Design Database Indexes',
          description: 'Add compound indexes on userId, status, dueDate',
          priority: 'high',
          status: 'pending',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          userId: user2Data.id, // Malicious spoof attempt: should be ignored!
        }),
      });

      const body = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(body.success === true, 'Expected body.success === true');
      assert(body.data.task.title === 'Design Database Indexes', 'Task title mismatch');
      assert(body.data.task.userId === user1Data.id, 'userId must be derived from token, not payload');
      assert(body.data.task.priority === 'high', 'Priority mismatch');

      createdTaskId = body.data.task.id;
      results.push({ name: '2. Create Task with Ownership & Ignore Spoofed userId', passed: true });
    } catch (err: any) {
      results.push({ name: '2. Create Task with Ownership & Ignore Spoofed userId', passed: false, error: err.message });
    }

    // TEST 3: Validate Task Input Constraints
    try {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          Cookie: cookieUser1,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          title: '', // Empty title should fail
          status: 'invalid-status',
        }),
      });

      assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
      results.push({ name: '3. Reject Invalid Task Payload via Zod Validation (HTTP 400)', passed: true });
    } catch (err: any) {
      results.push({ name: '3. Reject Invalid Task Payload via Zod Validation (HTTP 400)', passed: false, error: err.message });
    }

    // TEST 4: Retrieve individual task by ID
    try {
      const res = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
        method: 'GET',
        headers: {
          Cookie: cookieUser1,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const body = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(body.data.task.id === createdTaskId, 'Expected matching task id');
      results.push({ name: '4. Retrieve Individual Task by ID (HTTP 200)', passed: true });
    } catch (err: any) {
      results.push({ name: '4. Retrieve Individual Task by ID (HTTP 200)', passed: false, error: err.message });
    }

    // TEST 5: Reject Invalid ObjectId format
    try {
      const res = await fetch(`${baseUrl}/api/tasks/not-a-valid-id`, {
        method: 'GET',
        headers: {
          Cookie: cookieUser1,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      assert(res.status === 400, `Expected 400 Bad Request for malformed ID, got ${res.status}`);
      results.push({ name: '5. Validate MongoDB ObjectId Format in Params (HTTP 400)', passed: true });
    } catch (err: any) {
      results.push({ name: '5. Validate MongoDB ObjectId Format in Params (HTTP 400)', passed: false, error: err.message });
    }

    // TEST 6: Edit task (PUT)
    try {
      const res = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
        method: 'PUT',
        headers: {
          Cookie: cookieUser1,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          title: 'Design Database Indexes (Updated)',
          priority: 'medium',
        }),
      });

      const body = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(body.data.task.title === 'Design Database Indexes (Updated)', 'Title was not updated');
      assert(body.data.task.priority === 'medium', 'Priority was not updated');
      results.push({ name: '6. Edit Task via PUT (HTTP 200)', passed: true });
    } catch (err: any) {
      results.push({ name: '6. Edit Task via PUT (HTTP 200)', passed: false, error: err.message });
    }

    // TEST 7: Update task status (PATCH)
    try {
      const res = await fetch(`${baseUrl}/api/tasks/${createdTaskId}/status`, {
        method: 'PATCH',
        headers: {
          Cookie: cookieUser1,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          status: 'in-progress',
        }),
      });

      const body = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(body.data.task.status === 'in-progress', 'Status was not updated');
      results.push({ name: '7. Update Task Status via PATCH (HTTP 200)', passed: true });
    } catch (err: any) {
      results.push({ name: '7. Update Task Status via PATCH (HTTP 200)', passed: false, error: err.message });
    }

    // TEST 8: Cross-User Isolation (User 2 cannot read or modify User 1 task)
    try {
      // User 2 tries to GET User 1 task
      const getRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
        method: 'GET',
        headers: { Cookie: cookieUser2, 'X-Requested-With': 'XMLHttpRequest' },
      });
      assert(getRes.status === 404, `User 2 GET expected 404, got ${getRes.status}`);

      // User 2 tries to PUT User 1 task
      const putRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
        method: 'PUT',
        headers: { Cookie: cookieUser2, 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ title: 'Hacked by User 2' }),
      });
      assert(putRes.status === 404, `User 2 PUT expected 404, got ${putRes.status}`);

      // User 2 tries to DELETE User 1 task
      const delRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieUser2, 'X-Requested-With': 'XMLHttpRequest' },
      });
      assert(delRes.status === 404, `User 2 DELETE expected 404, got ${delRes.status}`);

      results.push({ name: '8. Strict Multi-Tenant Data Isolation (No Cross-User Access)', passed: true });
    } catch (err: any) {
      results.push({ name: '8. Strict Multi-Tenant Data Isolation (No Cross-User Access)', passed: false, error: err.message });
    }

    // Create extra tasks for search, filtering, and pagination testing
    await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { Cookie: cookieUser1, 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({
        title: 'Team Sprint Planning Meeting',
        priority: 'high',
        status: 'pending',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Overdue!
      }),
    });

    await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { Cookie: cookieUser1, 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({
        title: 'Client Demo Preparation',
        priority: 'low',
        status: 'completed',
        dueDate: new Date(Date.now() + 172800000).toISOString(),
      }),
    });

    // TEST 9: Search by title
    try {
      const res = await fetch(`${baseUrl}/api/tasks?search=meeting`, {
        method: 'GET',
        headers: { Cookie: cookieUser1, 'X-Requested-With': 'XMLHttpRequest' },
      });
      const body = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(body.data.tasks.length === 1, `Expected 1 match for "meeting", got ${body.data.tasks.length}`);
      assert(body.data.tasks[0].title.includes('Sprint Planning Meeting'), 'Title match failed');
      results.push({ name: '9. Title Search (Case-Insensitive Substring)', passed: true });
    } catch (err: any) {
      results.push({ name: '9. Title Search (Case-Insensitive Substring)', passed: false, error: err.message });
    }

    // TEST 10: Filtering by Status & Priority
    try {
      const res = await fetch(`${baseUrl}/api/tasks?status=completed`, {
        method: 'GET',
        headers: { Cookie: cookieUser1, 'X-Requested-With': 'XMLHttpRequest' },
      });
      const body = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(body.data.tasks.length === 1, 'Expected 1 completed task');
      assert(body.data.tasks[0].status === 'completed', 'Status mismatch');
      results.push({ name: '10. Filter by Status (HTTP 200)', passed: true });
    } catch (err: any) {
      results.push({ name: '10. Filter by Status (HTTP 200)', passed: false, error: err.message });
    }

    // TEST 11: Pagination and Metadata
    try {
      const res = await fetch(`${baseUrl}/api/tasks?page=1&limit=2`, {
        method: 'GET',
        headers: { Cookie: cookieUser1, 'X-Requested-With': 'XMLHttpRequest' },
      });
      const body = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(body.data.tasks.length === 2, `Expected 2 items on page 1, got ${body.data.tasks.length}`);
      assert(body.meta.total === 3, `Expected total 3, got ${body.meta.total}`);
      assert(body.meta.totalPages === 2, `Expected 2 total pages, got ${body.meta.totalPages}`);
      assert(body.meta.hasNextPage === true, 'Expected hasNextPage === true');
      assert(body.meta.hasPrevPage === false, 'Expected hasPrevPage === false');
      results.push({ name: '11. Pagination with Accurate Metadata (page, limit, total, totalPages)', passed: true });
    } catch (err: any) {
      results.push({ name: '11. Pagination with Accurate Metadata (page, limit, total, totalPages)', passed: false, error: err.message });
    }

    // TEST 12: Combined Complex Query
    // Example from prompt: GET /api/tasks?search=meeting&status=pending&priority=high&page=1&limit=10&sortBy=dueDate&order=asc
    try {
      const res = await fetch(
        `${baseUrl}/api/tasks?search=meeting&status=pending&priority=high&page=1&limit=10&sortBy=dueDate&order=asc`,
        {
          method: 'GET',
          headers: { Cookie: cookieUser1, 'X-Requested-With': 'XMLHttpRequest' },
        }
      );
      const body = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(body.data.tasks.length === 1, `Expected 1 match, got ${body.data.tasks.length}`);
      assert(body.data.tasks[0].title.includes('Meeting'), 'Task title must match');
      results.push({ name: '12. Combined Search + Filter + Sort + Pagination Query', passed: true });
    } catch (err: any) {
      results.push({ name: '12. Combined Search + Filter + Sort + Pagination Query', passed: false, error: err.message });
    }

    // TEST 13: Dashboard Statistics
    try {
      const res = await fetch(`${baseUrl}/api/dashboard/stats`, {
        method: 'GET',
        headers: { Cookie: cookieUser1, 'X-Requested-With': 'XMLHttpRequest' },
      });
      const body = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const stats = body.data.stats;
      assert(stats.total === 3, `Expected total 3, got ${stats.total}`);
      assert(stats.pending === 1, `Expected pending 1, got ${stats.pending}`);
      assert(stats.inProgress === 1, `Expected inProgress 1, got ${stats.inProgress}`);
      assert(stats.completed === 1, `Expected completed 1, got ${stats.completed}`);
      assert(stats.overdue === 1, `Expected overdue 1, got ${stats.overdue}`);
      results.push({ name: '13. Dashboard Statistics Calculation (Total, Statuses, Overdue)', passed: true });
    } catch (err: any) {
      results.push({ name: '13. Dashboard Statistics Calculation (Total, Statuses, Overdue)', passed: false, error: err.message });
    }

    // TEST 14: Dashboard Statistics User Isolation (User 2 has 0 tasks)
    try {
      const res = await fetch(`${baseUrl}/api/dashboard/stats`, {
        method: 'GET',
        headers: { Cookie: cookieUser2, 'X-Requested-With': 'XMLHttpRequest' },
      });
      const body = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const stats = body.data.stats;
      assert(stats.total === 0, `User 2 total must be 0, got ${stats.total}`);
      assert(stats.overdue === 0, 'User 2 overdue must be 0');
      results.push({ name: '14. Dashboard Statistics Scoped to Authenticated User', passed: true });
    } catch (err: any) {
      results.push({ name: '14. Dashboard Statistics Scoped to Authenticated User', passed: false, error: err.message });
    }

    // TEST 15: Delete Task
    try {
      const res = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieUser1, 'X-Requested-With': 'XMLHttpRequest' },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);

      // Verify task is gone
      const checkRes = await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, {
        method: 'GET',
        headers: { Cookie: cookieUser1, 'X-Requested-With': 'XMLHttpRequest' },
      });
      assert(checkRes.status === 404, `Deleted task should return 404, got ${checkRes.status}`);
      results.push({ name: '15. Delete Task and Confirm Removal (HTTP 200 -> 404)', passed: true });
    } catch (err: any) {
      results.push({ name: '15. Delete Task and Confirm Removal (HTTP 200 -> 404)', passed: false, error: err.message });
    }

  } catch (globalErr: any) {
    console.error('Task Test Suite fatal error:', globalErr);
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await disconnectDB();
  }

  // Print Summary
  console.log('\n====================================================');
  console.log(' TASK MANAGEMENT TEST RESULTS');
  console.log('====================================================');
  let passCount = 0;
  for (const r of results) {
    if (r.passed) {
      passCount++;
      console.log(`  [PASS] ${r.name}`);
    } else {
      console.log(`  [FAIL] ${r.name} - ${r.error}`);
    }
  }
  console.log('----------------------------------------------------');
  console.log(` Total: ${results.length} | Passed: ${passCount} | Failed: ${results.length - passCount}`);
  console.log('====================================================\n');

  if (passCount !== results.length) {
    process.exit(1);
  }
}

void runTaskTestSuite();
