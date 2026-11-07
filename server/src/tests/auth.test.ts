import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { env } from '../config/env.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: unknown;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log(' Starting TaskFlow PROMPT 02 Authentication Test Suite');
  console.log('====================================================\n');

  let server: any;
  let baseUrl = '';

  try {
    // 1. Connect to Database
    await connectDB();
    // Clean test user data
    await User.deleteMany({ email: { $in: ['testuser@taskflow.dev', 'duplicate@taskflow.dev'] } });

    // 2. Start HTTP server on an ephemeral port
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

    let authCookie = '';

    // TEST 1: Register new user
    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          name: 'Test Engineer',
          email: 'testuser@taskflow.dev',
          password: 'Password123!',
        }),
      });

      const body = await res.json();
      const setCookieHeader = res.headers.get('set-cookie') || '';

      assert(res.status === 201, `Expected status 201, got ${res.status}`);
      assert(body.success === true, 'Expected body.success === true');
      assert(body.data.user.email === 'testuser@taskflow.dev', 'Expected user email match');
      assert(!body.data.user.password, 'Password hash MUST NEVER be exposed in response');
      assert(setCookieHeader.includes(env.TOKEN_NAME), `Expected Set-Cookie to include ${env.TOKEN_NAME}`);
      assert(setCookieHeader.toLowerCase().includes('httponly'), 'Expected cookie to be HttpOnly');

      authCookie = setCookieHeader.split(';')[0];
      results.push({ name: '1. User Registration (Success + HTTP-Only Cookie)', passed: true });
    } catch (err: any) {
      results.push({ name: '1. User Registration (Success + HTTP-Only Cookie)', passed: false, error: err.message });
    }

    // TEST 2: Prevent duplicate registration
    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          name: 'Duplicate Engineer',
          email: 'testuser@taskflow.dev',
          password: 'Password123!',
        }),
      });

      const body = await res.json();
      assert(res.status === 409, `Expected status 409 Conflict, got ${res.status}`);
      assert(body.success === false, 'Expected body.success === false');
      results.push({ name: '2. Prevent Duplicate Email Registration', passed: true });
    } catch (err: any) {
      results.push({ name: '2. Prevent Duplicate Email Registration', passed: false, error: err.message });
    }

    // TEST 3: Validation Error on weak password
    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          name: 'Weak Password',
          email: 'weak@taskflow.dev',
          password: 'weak',
        }),
      });

      const body = await res.json();
      assert(res.status === 400, `Expected status 400 Bad Request, got ${res.status}`);
      assert(body.message === 'Validation failed', 'Expected validation error message');
      results.push({ name: '3. Reject Invalid/Weak Credentials with Zod Validation', passed: true });
    } catch (err: any) {
      results.push({ name: '3. Reject Invalid/Weak Credentials with Zod Validation', passed: false, error: err.message });
    }

    // TEST 4: Successful Login
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          email: 'testuser@taskflow.dev',
          password: 'Password123!',
        }),
      });

      const body = await res.json();
      const setCookieHeader = res.headers.get('set-cookie') || '';

      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.success === true, 'Expected body.success === true');
      assert(body.data.user.name === 'Test Engineer', 'Expected user name match');
      assert(!body.data.user.password, 'Password hash MUST NEVER be exposed in response');
      assert(setCookieHeader.includes(env.TOKEN_NAME), 'Expected cookie to be set on login');

      authCookie = setCookieHeader.split(';')[0];
      results.push({ name: '4. User Login (Success + HTTP-Only Cookie)', passed: true });
    } catch (err: any) {
      results.push({ name: '4. User Login (Success + HTTP-Only Cookie)', passed: false, error: err.message });
    }

    // TEST 5: Reject Invalid Password
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          email: 'testuser@taskflow.dev',
          password: 'WrongPassword!',
        }),
      });

      const body = await res.json();
      assert(res.status === 401, `Expected status 401, got ${res.status}`);
      assert(body.message === 'Invalid email or password.', 'Generic error message to prevent user enumeration');
      results.push({ name: '5. Reject Invalid Password (Anti-Enumeration)', passed: true });
    } catch (err: any) {
      results.push({ name: '5. Reject Invalid Password (Anti-Enumeration)', passed: false, error: err.message });
    }

    // TEST 6: Reject Unauthenticated Access to Protected Route
    try {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const body = await res.json();
      assert(res.status === 401, `Expected status 401, got ${res.status}`);
      assert(body.success === false, 'Expected success === false');
      results.push({ name: '6. Reject Unauthenticated Access to /api/auth/me', passed: true });
    } catch (err: any) {
      results.push({ name: '6. Reject Unauthenticated Access to /api/auth/me', passed: false, error: err.message });
    }

    // TEST 7: Allow Authenticated Access via HTTP-only Cookie
    try {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          Cookie: authCookie,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const body = await res.json();
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.data.user.email === 'testuser@taskflow.dev', 'Expected user email match');
      assert(!body.data.user.password, 'Password hash MUST NEVER be exposed');
      results.push({ name: '7. Persistent Session Verification via /api/auth/me', passed: true });
    } catch (err: any) {
      results.push({ name: '7. Persistent Session Verification via /api/auth/me', passed: false, error: err.message });
    }

    // TEST 8: Logout and clear cookie
    try {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: authCookie,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const body = await res.json();
      const setCookieHeader = res.headers.get('set-cookie') || '';

      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.success === true, 'Expected body.success === true');
      // Cookie clearing typically sets expires in the past or maxAge 0
      assert(
        setCookieHeader.includes('Expires=') || setCookieHeader.includes('Max-Age=0') || setCookieHeader.includes(`${env.TOKEN_NAME}=;`),
        'Expected cookie to be cleared'
      );
      results.push({ name: '8. Logout (Cookie Cleared)', passed: true });
    } catch (err: any) {
      results.push({ name: '8. Logout (Cookie Cleared)', passed: false, error: err.message });
    }

    // TEST 9: Health endpoint returns HTTP 200
    try {
      const res = await fetch(`${baseUrl}/health`);
      const body = await res.json();
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.success === true, 'Expected health success === true');
      assert(body.data.status === 'healthy', 'Expected database and system to be healthy');
      results.push({ name: '9. System Health Check Endpoint (HTTP 200)', passed: true });
    } catch (err: any) {
      results.push({ name: '9. System Health Check Endpoint (HTTP 200)', passed: false, error: err.message });
    }

  } catch (globalErr: any) {
    console.error('Test Suite encountered fatal error:', globalErr);
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await disconnectDB();
  }

  // Print Summary
  console.log('\n====================================================');
  console.log(' TEST EXECUTION RESULTS');
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

void runTestSuite();
