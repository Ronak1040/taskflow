import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Task } from '../models/task.model.js';
import { env } from '../config/env.js';

describe('TaskFlow Backend QA & Security Test Battery', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    await connectDB();
    app = createApp();
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test-qa\.dev$/ });
    await Task.deleteMany({});
    await disconnectDB();
  });

  // =========================================================================
  // 1. AUTHENTICATION MODULE TESTS
  // =========================================================================
  describe('Authentication Module', () => {
    beforeEach(async () => {
      await User.deleteMany({ email: /@test-qa\.dev$/ });
      await Task.deleteMany({});
    });

    const validUser = {
      name: 'QA Tester',
      email: 'qa.tester@test-qa.dev',
      password: 'SecurePassword123!',
    };

    it('1. Successful registration sets HTTP-only cookie and returns sanitized user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.name).toBe(validUser.name);
      expect(res.body.data.user.password).toBeUndefined();

      // Check cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies) ? cookies.join(';') : cookies).toContain('taskflow_token=');
      expect(Array.isArray(cookies) ? cookies.join(';') : cookies).toContain('HttpOnly');
    });

    it('2. Prevents duplicate email registration (HTTP 409 Conflict)', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .set('X-Requested-With', 'XMLHttpRequest');

      // Second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('3. Rejects invalid email format (HTTP 400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'not-a-valid-email-format',
          password: 'SecurePassword123!',
        })
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('4. Rejects weak password lacking minimum complexity rules (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Pass User',
          email: 'weakpass@test-qa.dev',
          password: 'weak', // too short, no uppercase, no number
        })
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('5. Successful login with correct credentials returns HTTP 200 and auth cookie', async () => {
      // Pre-register user
      await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .set('X-Requested-With', 'XMLHttpRequest');

      // Login
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password })
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.password).toBeUndefined();

      const cookies = res.headers['set-cookie'];
      expect(Array.isArray(cookies) ? cookies.join(';') : cookies).toContain('taskflow_token=');
    });

    it('6. Rejects incorrect password with anti-enumeration response (HTTP 401)', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .set('X-Requested-With', 'XMLHttpRequest');

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'WrongPassword999!' })
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('7. Missing authentication rejected with HTTP 401 on protected endpoint', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('8. Rejects invalid and expired tokens with HTTP 401', async () => {
      // 8a. Tampered token
      const tamperedRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['taskflow_token=tampered.fake.jwt.token']);

      expect(tamperedRes.status).toBe(401);
      expect(tamperedRes.body.success).toBe(false);

      // 8b. Expired token signed with same secret
      const expiredToken = jwt.sign(
        { id: '507f1f77bcf86cd799439011', email: 'expired@test-qa.dev' },
        env.JWT_SECRET,
        { expiresIn: '-10s' }
      );

      const expiredRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`taskflow_token=${expiredToken}`]);

      expect(expiredRes.status).toBe(401);
      expect(expiredRes.body.success).toBe(false);
    });

    it('9. Logout clears authentication cookie (HTTP 200)', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .set('X-Requested-With', 'XMLHttpRequest');

      const cookie = regRes.headers['set-cookie'];

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(logoutRes.status).toBe(200);
      const clearedCookies = logoutRes.headers['set-cookie'];
      const cookieStr = Array.isArray(clearedCookies) ? clearedCookies.join(';') : clearedCookies;
      expect(
        cookieStr.includes('taskflow_token=;') ||
          cookieStr.includes('Max-Age=0') ||
          cookieStr.includes('Expires=')
      ).toBe(true);
    });
  });

  // =========================================================================
  // 2. TASK MANAGEMENT MODULE TESTS
  // =========================================================================
  describe('Task Management Module', () => {
    let user1Cookie: string[] = [];
    let user2Cookie: string[] = [];

    beforeAll(async () => {
      await User.deleteMany({ email: /@test-qa\.dev$/ });
      await Task.deleteMany({});

      // Register user 1
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User One',
          email: 'user1@test-qa.dev',
          password: 'Password123!',
        })
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(res1.status).toBe(201);
      const c1 = res1.headers['set-cookie'];
      user1Cookie = Array.isArray(c1) ? c1 : typeof c1 === 'string' ? [c1] : [];

      // Register user 2
      const res2 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User Two',
          email: 'user2@test-qa.dev',
          password: 'Password456!',
        })
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(res2.status).toBe(201);
      const c2 = res2.headers['set-cookie'];
      user2Cookie = Array.isArray(c2) ? c2 : typeof c2 === 'string' ? [c2] : [];
    });

    beforeEach(async () => {
      await Task.deleteMany({});
    });

    it('10. Create task with full metadata returns HTTP 201', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          title: 'Implement QA Automation Suite',
          description: 'Vitest + Supertest integration tests',
          status: 'pending',
          priority: 'high',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('Implement QA Automation Suite');
      expect(res.body.data.task.priority).toBe('high');
      expect(res.body.data.task.id).toBeDefined();
    });

    it('11. Get tasks returns paginated task list with metadata', async () => {
      // Create 2 tasks for user 1
      await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'Task A', priority: 'low' });

      await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'Task B', priority: 'medium' });

      const res = await request(app).get('/api/tasks').set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
      expect(res.body.meta.page).toBe(1);
    });

    it('12. Get task by ID returns individual task record', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'Specific Task', priority: 'high' });

      const taskId = createRes.body.data.task.id;

      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.task.id).toBe(taskId);
      expect(res.body.data.task.title).toBe('Specific Task');
    });

    it('13. Update task via PUT modifies record', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'Original Title', priority: 'low' });

      const taskId = createRes.body.data.task.id;

      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'Updated Title', priority: 'high' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.title).toBe('Updated Title');
      expect(res.body.data.task.priority).toBe('high');
    });

    it('14. Delete task removes record from database (HTTP 200 -> 404)', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'Task to Delete' });

      const taskId = createRes.body.data.task.id;

      const deleteRes = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(deleteRes.status).toBe(200);

      // Verify 404 on subsequent read
      const verifyRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Cookie', user1Cookie);

      expect(verifyRes.status).toBe(404);
    });

    it('15. Rejects invalid MongoDB ObjectId format (HTTP 400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/tasks/not-a-valid-hex-id')
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body.details)).toContain('Invalid MongoDB ObjectId format');
    });

    it('16. Rejects invalid task payload data (empty title, invalid status)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          title: '', // empty title
          status: 'non-existent-status',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('17. Unauthorized task access rejected without valid session (HTTP 401)', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(401);
    });

    it('18. Cross-user task access strictly isolated (HTTP 404 Not Found)', async () => {
      // User 1 creates a private task
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'Confidential Strategy' });

      const user1TaskId = createRes.body.data.task.id;

      // User 2 attempts to read User 1's task
      const readRes = await request(app)
        .get(`/api/tasks/${user1TaskId}`)
        .set('Cookie', user2Cookie);
      expect(readRes.status).toBe(404);

      // User 2 attempts to update User 1's task
      const editRes = await request(app)
        .put(`/api/tasks/${user1TaskId}`)
        .set('Cookie', user2Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'Tampered Strategy' });
      expect(editRes.status).toBe(404);

      // User 2 attempts to delete User 1's task
      const delRes = await request(app)
        .delete(`/api/tasks/${user1TaskId}`)
        .set('Cookie', user2Cookie)
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(delRes.status).toBe(404);
    });

    it('19. Search and filters work concurrently against database results', async () => {
      await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'Quarterly Sprint Planning', status: 'pending', priority: 'high' });

      await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'Sprint Retrospective', status: 'completed', priority: 'high' });

      await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'Refactor Database Queries', status: 'pending', priority: 'low' });

      // Combined search + status + priority
      const res = await request(app)
        .get('/api/tasks?search=Sprint&status=pending&priority=high')
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks).toHaveLength(1);
      expect(res.body.data.tasks[0].title).toBe('Quarterly Sprint Planning');
    });

    it('20. Pagination returns accurate metadata boundaries', async () => {
      // Create 5 tasks
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/tasks')
          .set('Cookie', user1Cookie)
          .set('X-Requested-With', 'XMLHttpRequest')
          .send({ title: `Task Number ${i}` });
      }

      // Page 1 with limit 2
      const page1Res = await request(app)
        .get('/api/tasks?page=1&limit=2')
        .set('Cookie', user1Cookie);

      expect(page1Res.status).toBe(200);
      expect(page1Res.body.data.tasks).toHaveLength(2);
      expect(page1Res.body.meta.total).toBe(5);
      expect(page1Res.body.meta.totalPages).toBe(3);
      expect(page1Res.body.meta.hasNextPage).toBe(true);
      expect(page1Res.body.meta.hasPrevPage).toBe(false);

      // Page 3 with limit 2
      const page3Res = await request(app)
        .get('/api/tasks?page=3&limit=2')
        .set('Cookie', user1Cookie);

      expect(page3Res.status).toBe(200);
      expect(page3Res.body.data.tasks).toHaveLength(1);
      expect(page3Res.body.meta.hasNextPage).toBe(false);
      expect(page3Res.body.meta.hasPrevPage).toBe(true);
    });

    it('21. Dashboard statistics accurately aggregate total, pending, in-progress, completed, and overdue', async () => {
      // 1 overdue pending task
      await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          title: 'Overdue Bugfix',
          status: 'pending',
          dueDate: new Date(Date.now() - 86400000).toISOString(),
        });

      // 1 in-progress task
      await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          title: 'Active Feature Work',
          status: 'in-progress',
        });

      // 1 completed task
      await request(app)
        .post('/api/tasks')
        .set('Cookie', user1Cookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          title: 'Finished Milestone',
          status: 'completed',
        });

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      const stats = res.body.data.stats;
      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.overdue).toBe(1);
    });
  });
});
