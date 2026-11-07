import { Types } from 'mongoose';
import { Task } from '../models/task.model.js';
import type { DashboardStats } from '../types/index.js';

export class DashboardService {
  /**
   * Calculate task statistics exclusively for the authenticated user.
   */
  public static async getStats(userId: string): Promise<DashboardStats> {
    const userObjectId = new Types.ObjectId(userId);
    const now = new Date();

    // Use indexed count queries running concurrently
    const [total, pending, inProgress, completed, overdue] = await Promise.all([
      Task.countDocuments({ userId: userObjectId }).exec(),
      Task.countDocuments({ userId: userObjectId, status: 'pending' }).exec(),
      Task.countDocuments({ userId: userObjectId, status: 'in-progress' }).exec(),
      Task.countDocuments({ userId: userObjectId, status: 'completed' }).exec(),
      Task.countDocuments({
        userId: userObjectId,
        status: { $ne: 'completed' },
        dueDate: { $lt: now },
      }).exec(),
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
    };
  }
}

