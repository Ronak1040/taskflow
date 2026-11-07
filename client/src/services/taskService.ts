import apiClient from './apiClient';
import type { ApiResponse } from '../types/api';
import type { Task, CreateTaskPayload, UpdateTaskPayload, GetTasksParams, TaskStatus } from '../types/task';

export class TaskService {
  /**
   * Retrieve tasks with search, filter, sorting, and pagination
   */
  static async getTasks(params?: GetTasksParams): Promise<{ tasks: Task[]; meta: any }> {
    const response = await apiClient.get<ApiResponse<{ tasks: Task[] }>>('/tasks', {
      params,
    });
    return {
      tasks: response.data.data.tasks,
      meta: response.data.meta,
    };
  }

  /**
   * Retrieve an individual task by ID
   */
  static async getTaskById(id: string): Promise<Task> {
    const response = await apiClient.get<ApiResponse<{ task: Task }>>(`/tasks/${id}`);
    return response.data.data.task;
  }

  /**
   * Create a new task
   */
  static async createTask(payload: CreateTaskPayload): Promise<Task> {
    const response = await apiClient.post<ApiResponse<{ task: Task }>>('/tasks', payload);
    return response.data.data.task;
  }

  /**
   * Edit/update a task
   */
  static async updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
    const response = await apiClient.put<ApiResponse<{ task: Task }>>(`/tasks/${id}`, payload);
    return response.data.data.task;
  }

  /**
   * Update task status
   */
  static async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const response = await apiClient.patch<ApiResponse<{ task: Task }>>(`/tasks/${id}/status`, {
      status,
    });
    return response.data.data.task;
  }

  /**
   * Delete a task
   */
  static async deleteTask(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/tasks/${id}`);
  }
}

