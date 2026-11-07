import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/task.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  getTasksQuerySchema,
  taskIdParamSchema,
} from '../validators/task.validator.js';

const router = Router();

// All task routes require authentication
router.use(authenticate);

// POST /api/tasks - Create task
router.post('/', validate({ body: createTaskSchema }), createTask);

// GET /api/tasks - Retrieve tasks with search, filter, sort, and pagination
router.get('/', validate({ query: getTasksQuerySchema }), getTasks);

// GET /api/tasks/:id - Retrieve individual task
router.get('/:id', validate({ params: taskIdParamSchema }), getTaskById);

// PUT /api/tasks/:id - Edit task
router.put(
  '/:id',
  validate({ params: taskIdParamSchema, body: updateTaskSchema }),
  updateTask
);

// PATCH /api/tasks/:id/status - Update task status
router.patch(
  '/:id/status',
  validate({ params: taskIdParamSchema, body: updateTaskStatusSchema }),
  updateTaskStatus
);

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', validate({ params: taskIdParamSchema }), deleteTask);

export const taskRoutes = router;

