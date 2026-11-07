import { Types } from 'mongoose';
import { Task } from '../models/task.model.js';
import { AppError } from '../utils/appError.js';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  GetTasksQuery,
} from '../validators/task.validator.js';
import type { TaskResponse, PaginationMeta, TaskStatus } from '../types/index.js';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export class TaskService {
  /**
   * Create a new task strictly attached to the authenticated userId.
   */
  public static async createTask(userId: string, input: CreateTaskInput): Promise<TaskResponse> {
    const task = await Task.create({
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      status: input.status ?? 'pending',
      priority: input.priority ?? 'medium',
      dueDate: input.dueDate ?? undefined,
      userId: new Types.ObjectId(userId), // Never trust payload userId
    });

    return task.toJSON() as unknown as TaskResponse;
  }

  /**
   * Retrieve tasks belonging solely to the authenticated user with search, filters, sorting, and pagination.
   */
  public static async getTasks(
    userId: string,
    query: GetTasksQuery
  ): Promise<{ tasks: TaskResponse[]; meta: PaginationMeta }> {
    const { search, status, priority, sortBy, order, page, limit } = query;

    // Base query scoped to the user
    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    // Filter by status if provided
    if (status) {
      filter.status = status;
    }

    // Filter by priority if provided
    if (priority) {
      filter.priority = priority;
    }

    // Search by title (case-insensitive substring)
    if (search && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      filter.title = { $regex: sanitized, $options: 'i' };
    }

    // Sorting configuration
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortField = sortBy || 'createdAt';
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortDirection };

    // Secondary sort to ensure deterministic pagination
    sortOptions._id = -1;

    // Pagination calculations
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sortOptions).skip(skip).limit(limit).exec(),
      Task.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return {
      tasks: tasks.map((t) => t.toJSON() as unknown as TaskResponse),
      meta,
    };
  }

  /**
   * Retrieve an individual task by ID belonging to the user.
   */
  public static async getTaskById(userId: string, taskId: string): Promise<TaskResponse> {
    const task = await Task.findOne({
      _id: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!task) {
      throw AppError.notFound('Task not found');
    }

    return task.toJSON() as unknown as TaskResponse;
  }

  /**
   * Edit task details ensuring ownership.
   */
  public static async updateTask(
    userId: string,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<TaskResponse> {
    const task = await Task.findOne({
      _id: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!task) {
      throw AppError.notFound('Task not found');
    }

    // Safely apply updates
    if (input.title !== undefined) task.title = input.title.trim();
    if (input.description !== undefined) task.description = input.description.trim();
    if (input.status !== undefined) task.status = input.status;
    if (input.priority !== undefined) task.priority = input.priority;
    if (input.dueDate !== undefined) task.dueDate = input.dueDate ?? undefined;

    await task.save();

    return task.toJSON() as unknown as TaskResponse;
  }

  /**
   * Update task status ensuring ownership.
   */
  public static async updateTaskStatus(
    userId: string,
    taskId: string,
    status: TaskStatus
  ): Promise<TaskResponse> {
    const task = await Task.findOne({
      _id: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!task) {
      throw AppError.notFound('Task not found');
    }

    task.status = status;
    await task.save();

    return task.toJSON() as unknown as TaskResponse;
  }

  /**
   * Delete a task ensuring ownership.
   */
  public static async deleteTask(userId: string, taskId: string): Promise<void> {
    const task = await Task.findOneAndDelete({
      _id: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!task) {
      throw AppError.notFound('Task not found');
    }
  }
}
