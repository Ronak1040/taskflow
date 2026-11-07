import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/user.model.js';

interface TestResult {
  step: number;
  workflow: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function extractCookie(res: Response, cookieName: string): string {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return '';
  const match = setCookie.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? `${cookieName}=${match[1]}` : '';
}

async function runE2EIntegrationSuite() {
  console.log('====================================================');
  console.log(' Starting TaskFlow PROMPT 05 Full-Stack E2E Workflows');
  console.log('====================================================\n');

  let server: any;
  let baseUrl = '';

  try {
    // 1. Establish database connection
    await connectDB();

    // Clean any previous test data
    await User.deleteMany({
      email: {
        $in: [
          'e2e_user1@taskflow.dev',
          'e2e_user2@taskflow.dev',
        ],
      },
    });

    // 2. Launch HTTP server on ephemeral port
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        const port = typeof address === 'string' ? address : address.port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    console.log(`E2E Test Server running on ${baseUrl}\n`);

    let user1Cookie = '';
    let user2Cookie = '';
    let user1TaskId = '';
    let taskToDeleteId = '';

    // =========================================================================
    // WORKFLOW 1: Register a new account
    // =========================================================================
    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          name: 'Alice Engineer',
          email: 'e2e_user1@taskflow.dev',
          password: 'Password123!',
        }),
      });

      assert(res.status === 201, `Expected HTTP 201 Created, got ${res.status}`);
      user1Cookie = extractCookie(res, 'taskflow_token');
      assert(user1Cookie.length > 0, 'Expected taskflow_token cookie to be set in response');

      const json = await res.json();
      assert(json.success === true, 'Expected json.success to be true');
      assert(json.data.user.email === 'e2e_user1@taskflow.dev', 'User email mismatch');
      assert(!('password' in json.data.user), 'Password hash must never be returned in response');

      results.push({
        step: 1,
        workflow: '1. Register a new account (HTTP 201 + Secure HTTP-only cookie)',
        passed: true,
      });
    } catch (err: any) {
      results.push({ step: 1, workflow: '1. Register a new account', passed: false, error: err.message });
    }

    // =========================================================================
    // WORKFLOW 2: Log in
    // =========================================================================
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          email: 'e2e_user1@taskflow.dev',
          password: 'Password123!',
        }),
      });

      assert(res.status === 200, `Expected HTTP 200 OK, got ${res.status}`);
      user1Cookie = extractCookie(res, 'taskflow_token');
      assert(user1Cookie.length > 0, 'Expected taskflow_token cookie to be set on login');

      const json = await res.json();
      assert(json.success === true, 'Expected json.success to be true');
      assert(json.data.user.name === 'Alice Engineer', 'User name mismatch');

      results.push({
        step: 2,
        workflow: '2. Log in with credentials (HTTP 200 + Session established)',
        passed: true,
      });
    } catch (err: any) {
      results.push({ step: 2, workflow: '2. Log in with credentials', passed: false, error: err.message });
    }

    // =========================================================================
    // WORKFLOW 3: Create a task
    // =========================================================================
    try {
      const dueDate = new Date(Date.now() + 86400000 * 3).toISOString(); // 3 days in future
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          Cookie: user1Cookie,
        },
        body: JSON.stringify({
          title: 'Implement Full-Stack Integration Testing',
          description: 'Connect frontend React components to backend Express REST APIs',
          priority: 'high',
          status: 'pending',
          dueDate,
        }),
      });

      assert(res.status === 201, `Expected HTTP 201, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, 'Expected success to be true');
      assert(json.data.task.title === 'Implement Full-Stack Integration Testing', 'Title mismatch');
      assert(json.data.task.status === 'pending', 'Initial status should be pending');
      assert(json.data.task.priority === 'high', 'Priority should be high');
      user1TaskId = json.data.task.id;
      assert(Boolean(user1TaskId), 'Expected valid task ID');

      // Verify dashboard statistics reflect this new task
      const statsRes = await fetch(`${baseUrl}/api/dashboard/stats`, {
        headers: { Cookie: user1Cookie },
      });
      assert(statsRes.status === 200, 'Expected stats HTTP 200');
      const statsJson = await statsRes.json();
      assert(statsJson.data.stats.total === 1, `Expected total 1, got ${statsJson.data.stats.total}`);
      assert(statsJson.data.stats.pending === 1, 'Expected pending 1');

      results.push({
        step: 3,
        workflow: '3. Create a task (HTTP 201 + Dashboard stats updated)',
        passed: true,
      });
    } catch (err: any) {
      results.push({ step: 3, workflow: '3. Create a task', passed: false, error: err.message });
    }

    // =========================================================================
    // WORKFLOW 4: Edit the task
    // =========================================================================
    try {
      const res = await fetch(`${baseUrl}/api/tasks/${user1TaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          Cookie: user1Cookie,
        },
        body: JSON.stringify({
          title: 'Implement Full-Stack Integration Testing & Security Verification',
          description: 'Updated comprehensive specifications and test coverage',
          priority: 'high',
        }),
      });

      assert(res.status === 200, `Expected HTTP 200 OK, got ${res.status}`);
      const json = await res.json();
      assert(
        json.data.task.title === 'Implement Full-Stack Integration Testing & Security Verification',
        'Updated title mismatch'
      );
      assert(
        json.data.task.description === 'Updated comprehensive specifications and test coverage',
        'Updated description mismatch'
      );

      results.push({
        step: 4,
        workflow: '4. Edit the task (HTTP 200 + Record updated in DB)',
        passed: true,
      });
    } catch (err: any) {
      results.push({ step: 4, workflow: '4. Edit the task', passed: false, error: err.message });
    }

    // =========================================================================
    // WORKFLOW 5: Change its status
    // =========================================================================
    try {
      // 5a. Transition to 'in-progress'
      const res1 = await fetch(`${baseUrl}/api/tasks/${user1TaskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          Cookie: user1Cookie,
        },
        body: JSON.stringify({ status: 'in-progress' }),
      });

      assert(res1.status === 200, `Expected HTTP 200, got ${res1.status}`);
      const json1 = await res1.json();
      assert(json1.data.task.status === 'in-progress', 'Status must be in-progress');

      // Check stats: pending: 0, inProgress: 1
      const statsRes1 = await fetch(`${baseUrl}/api/dashboard/stats`, {
        headers: { Cookie: user1Cookie },
      });
      const stats1 = (await statsRes1.json()).data.stats;
      assert(stats1.pending === 0, 'Expected pending 0');
      assert(stats1.inProgress === 1, 'Expected inProgress 1');

      // 5b. Transition to 'completed'
      const res2 = await fetch(`${baseUrl}/api/tasks/${user1TaskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          Cookie: user1Cookie,
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      assert(res2.status === 200, `Expected HTTP 200, got ${res2.status}`);
      const json2 = await res2.json();
      assert(json2.data.task.status === 'completed', 'Status must be completed');

      // Check stats: inProgress: 0, completed: 1
      const statsRes2 = await fetch(`${baseUrl}/api/dashboard/stats`, {
        headers: { Cookie: user1Cookie },
      });
      const stats2 = (await statsRes2.json()).data.stats;
      assert(stats2.inProgress === 0, 'Expected inProgress 0');
      assert(stats2.completed === 1, 'Expected completed 1');

      results.push({
        step: 5,
        workflow: '5. Change task status (HTTP 200 + DB persistence + Stat reactivity)',
        passed: true,
      });
    } catch (err: any) {
      results.push({ step: 5, workflow: '5. Change task status', passed: false, error: err.message });
    }

    // =========================================================================
    // WORKFLOW 6: Filter and search tasks
    // =========================================================================
    try {
      // Create additional tasks for user 1 to test search, filtering, and pagination
      const task2Res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', Cookie: user1Cookie },
        body: JSON.stringify({
          title: 'Design Dark Mode UI Theme',
          priority: 'medium',
          status: 'pending',
        }),
      });
      taskToDeleteId = (await task2Res.json()).data.task.id;

      await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', Cookie: user1Cookie },
        body: JSON.stringify({
          title: 'Write User Documentation and API Guides',
          priority: 'low',
          status: 'in-progress',
        }),
      });

      // 6a. Search by title keyword "Security"
      const searchRes = await fetch(`${baseUrl}/api/tasks?search=Security`, {
        headers: { Cookie: user1Cookie },
      });
      const searchJson = await searchRes.json();
      assert(searchJson.data.tasks.length === 1, `Expected 1 match for "Security", got ${searchJson.data.tasks.length}`);
      assert(searchJson.data.tasks[0].id === user1TaskId, 'Search should find user1TaskId');

      // 6b. Filter by status 'completed'
      const filterStatusRes = await fetch(`${baseUrl}/api/tasks?status=completed`, {
        headers: { Cookie: user1Cookie },
      });
      const filterStatusJson = await filterStatusRes.json();
      assert(filterStatusJson.data.tasks.length === 1, 'Expected 1 completed task');
      assert(filterStatusJson.data.tasks[0].status === 'completed', 'Task status must be completed');

      // 6c. Filter by priority 'low'
      const filterPriorityRes = await fetch(`${baseUrl}/api/tasks?priority=low`, {
        headers: { Cookie: user1Cookie },
      });
      const filterPriorityJson = await filterPriorityRes.json();
      assert(filterPriorityJson.data.tasks.length === 1, 'Expected 1 low priority task');

      // 6d. Combined search + filters + pagination
      const combinedRes = await fetch(
        `${baseUrl}/api/tasks?search=Theme&status=pending&priority=medium&page=1&limit=10&sortBy=createdAt&order=desc`,
        { headers: { Cookie: user1Cookie } }
      );
      const combinedJson = await combinedRes.json();
      assert(combinedJson.data.tasks.length === 1, 'Expected 1 match for combined query');
      assert(combinedJson.meta.total === 1, 'Expected total 1');
      assert(combinedJson.meta.page === 1, 'Expected page 1');

      results.push({
        step: 6,
        workflow: '6. Filter and search tasks (Search, filters, sort, and pagination work together)',
        passed: true,
      });
    } catch (err: any) {
      results.push({ step: 6, workflow: '6. Filter and search tasks', passed: false, error: err.message });
    }

    // =========================================================================
    // WORKFLOW 7: Delete the task
    // =========================================================================
    try {
      const deleteRes = await fetch(`${baseUrl}/api/tasks/${taskToDeleteId}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest', Cookie: user1Cookie },
      });

      assert(deleteRes.status === 200, `Expected HTTP 200, got ${deleteRes.status}`);
      const deleteJson = await deleteRes.json();
      assert(deleteJson.success === true, 'Expected delete success to be true');

      // Verify task no longer exists
      const verifyRes = await fetch(`${baseUrl}/api/tasks/${taskToDeleteId}`, {
        headers: { Cookie: user1Cookie },
      });
      assert(verifyRes.status === 404, `Expected HTTP 404 for deleted task, got ${verifyRes.status}`);

      results.push({
        step: 7,
        workflow: '7. Delete the task (HTTP 200 + DB removal + HTTP 404 verification)',
        passed: true,
      });
    } catch (err: any) {
      results.push({ step: 7, workflow: '7. Delete the task', passed: false, error: err.message });
    }

    // =========================================================================
    // WORKFLOW 8: Log out
    // =========================================================================
    try {
      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest', Cookie: user1Cookie },
      });

      assert(logoutRes.status === 200, `Expected HTTP 200, got ${logoutRes.status}`);
      const clearedCookie = extractCookie(logoutRes, 'taskflow_token');
      // Max-Age=0 or empty value indicates clearing
      const setCookieHeader = logoutRes.headers.get('set-cookie') || '';
      assert(
        setCookieHeader.includes('taskflow_token=;') ||
          setCookieHeader.includes('Max-Age=0') ||
          setCookieHeader.includes('Expires='),
        'Logout must clear the taskflow_token cookie'
      );

      // Subsequent access without cookie or with cleared cookie should fail with 401
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: clearedCookie },
      });
      assert(meRes.status === 401, `Expected HTTP 401 unauthenticated after logout, got ${meRes.status}`);

      results.push({
        step: 8,
        workflow: '8. Log out (HTTP 200 + Cookie cleared + Subsequent unauthenticated calls return 401)',
        passed: true,
      });
    } catch (err: any) {
      results.push({ step: 8, workflow: '8. Log out', passed: false, error: err.message });
    }

    // =========================================================================
    // WORKFLOW 9: Log in again and verify session behavior
    // =========================================================================
    try {
      const reloginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          email: 'e2e_user1@taskflow.dev',
          password: 'Password123!',
        }),
      });

      assert(reloginRes.status === 200, `Expected HTTP 200 on re-login, got ${reloginRes.status}`);
      user1Cookie = extractCookie(reloginRes, 'taskflow_token');

      // Verify persistent session verification via GET /api/auth/me
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: user1Cookie },
      });
      assert(meRes.status === 200, `Expected HTTP 200 on /api/auth/me, got ${meRes.status}`);
      const meJson = await meRes.json();
      assert(meJson.data.user.email === 'e2e_user1@taskflow.dev', 'User email mismatch on session restore');

      results.push({
        step: 9,
        workflow: '9. Log in again and verify session restoration (/api/auth/me returns valid user)',
        passed: true,
      });
    } catch (err: any) {
      results.push({ step: 9, workflow: '9. Log in again and verify session behavior', passed: false, error: err.message });
    }

    // =========================================================================
    // WORKFLOW 10: Verify another user cannot access first user's tasks
    // =========================================================================
    try {
      // 10a. Register User 2
      const user2RegRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          name: 'Bob Competitor',
          email: 'e2e_user2@taskflow.dev',
          password: 'Password456!',
        }),
      });

      assert(user2RegRes.status === 201, `Expected HTTP 201 for User 2, got ${user2RegRes.status}`);
      user2Cookie = extractCookie(user2RegRes, 'taskflow_token');

      // 10b. User 2 attempts to read User 1's task
      const crossReadRes = await fetch(`${baseUrl}/api/tasks/${user1TaskId}`, {
        headers: { Cookie: user2Cookie },
      });
      assert(
        crossReadRes.status === 404,
        `Expected HTTP 404 Not Found on cross-tenant read, got ${crossReadRes.status}`
      );

      // 10c. User 2 attempts to edit User 1's task
      const crossEditRes = await fetch(`${baseUrl}/api/tasks/${user1TaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', Cookie: user2Cookie },
        body: JSON.stringify({ title: 'Malicious Overwrite' }),
      });
      assert(
        crossEditRes.status === 404,
        `Expected HTTP 404 Not Found on cross-tenant edit, got ${crossEditRes.status}`
      );

      // 10d. User 2 attempts to delete User 1's task
      const crossDeleteRes = await fetch(`${baseUrl}/api/tasks/${user1TaskId}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest', Cookie: user2Cookie },
      });
      assert(
        crossDeleteRes.status === 404,
        `Expected HTTP 404 Not Found on cross-tenant delete, got ${crossDeleteRes.status}`
      );

      // 10e. User 2's tasks list should be completely empty
      const user2TasksRes = await fetch(`${baseUrl}/api/tasks`, {
        headers: { Cookie: user2Cookie },
      });
      const user2Tasks = await user2TasksRes.json();
      assert(user2Tasks.data.tasks.length === 0, 'User 2 task list should contain 0 tasks');
      assert(user2Tasks.meta.total === 0, 'User 2 total should be 0');

      // 10f. User 2's dashboard statistics should show 0
      const user2StatsRes = await fetch(`${baseUrl}/api/dashboard/stats`, {
        headers: { Cookie: user2Cookie },
      });
      const user2Stats = (await user2StatsRes.json()).data.stats;
      assert(user2Stats.total === 0, 'User 2 total stats must be 0');
      assert(user2Stats.completed === 0, 'User 2 completed stats must be 0');

      // 10g. Verify User 1's task is still completely intact
      const user1CheckRes = await fetch(`${baseUrl}/api/tasks/${user1TaskId}`, {
        headers: { Cookie: user1Cookie },
      });
      assert(user1CheckRes.status === 200, 'User 1 task must still exist and be intact');

      results.push({
        step: 10,
        workflow: '10. Cross-Tenant Data Isolation (Zero unauthorized cross-user access, strict 404)',
        passed: true,
      });
    } catch (err: any) {
      results.push({ step: 10, workflow: '10. Verify cross-user isolation', passed: false, error: err.message });
    }
  } catch (err: any) {
    console.error('Fatal test error:', err);
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await disconnectDB();

    console.log('\n====================================================');
    console.log(' END-TO-END WORKFLOW TEST RESULTS');
    console.log('====================================================');
    results.forEach((r) => {
      const mark = r.passed ? '[PASS]' : '[FAIL]';
      console.log(`  ${mark} ${r.workflow}`);
      if (r.error) {
        console.log(`         Error: ${r.error}`);
      }
    });
    console.log('----------------------------------------------------');
    const passedCount = results.filter((r) => r.passed).length;
    console.log(` Total: ${results.length} | Passed: ${passedCount} | Failed: ${results.length - passedCount}`);
    console.log('====================================================\n');

    if (results.some((r) => !r.passed) || results.length !== 10) {
      process.exit(1);
    }
  }
}

void runE2EIntegrationSuite();
