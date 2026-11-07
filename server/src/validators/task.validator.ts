import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = z
  .string({ required_error: 'ID is required' })
  .regex(objectIdRegex, 'Invalid MongoDB ObjectId format');

export const taskIdParamSchema = z.object({
  id: objectIdSchema,
});

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Task title is required' })
    .trim()
    .min(1, 'Title must not be empty')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),
  status: z
    .enum(['pending', 'in-progress', 'completed'], {
      errorMap: () => ({ message: 'Status must be pending, in-progress, or completed' }),
    })
    .default('pending')
    .optional(),
  priority: z
    .enum(['low', 'medium', 'high'], {
      errorMap: () => ({ message: 'Priority must be low, medium, or high' }),
    })
    .default('medium')
    .optional(),
  dueDate: z
    .union([z.string().datetime({ message: 'Invalid ISO date string' }), z.string().date(), z.date()])
    .pipe(z.coerce.date())
    .optional()
    .nullable(),
});

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title must not be empty')
      .max(200, 'Title cannot exceed 200 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional(),
    status: z
      .enum(['pending', 'in-progress', 'completed'], {
        errorMap: () => ({ message: 'Status must be pending, in-progress, or completed' }),
      })
      .optional(),
    priority: z
      .enum(['low', 'medium', 'high'], {
        errorMap: () => ({ message: 'Priority must be low, medium, or high' }),
      })
      .optional(),
    dueDate: z
      .union([z.string().datetime(), z.string().date(), z.date()])
      .pipe(z.coerce.date())
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in-progress', 'completed'], {
    errorMap: (issue) => {
      if (issue.code === 'invalid_type') {
        return { message: 'Status is required and must be a string' };
      }
      return { message: 'Status must be pending, in-progress, or completed' };
    },
  }),
});

export const getTasksQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['pending', 'in-progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  sortBy: z.enum(['dueDate', 'createdAt', 'title', 'priority']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type GetTasksQuery = z.infer<typeof getTasksQuerySchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
