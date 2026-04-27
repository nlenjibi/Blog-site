import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { ApiResponse } from '@/utils/response.util';
import { AppError } from '@/utils/error.util';
import { asyncHandler } from '@/middleware/logger.middleware';
import { UserRole } from '@/types';

/**
 * AdminController handles admin-only endpoints
 */
export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  /**
   * GET /api/admin/analytics
   * Get dashboard analytics
   */
  getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const period = req.query.period as 'week' | 'month' || 'week';
    const data = await this.adminService.getAnalytics(period);

    return ApiResponse.success(res, data);
  });

  /**
   * GET /api/admin/dashboard
   * Get dashboard summary stats
   */
  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.adminService.getDashboardStats();

    return ApiResponse.success(res, stats);
  });

  /**
   * GET /api/admin/comments/pending
   * Get pending comments for moderation
   */
  getPendingComments = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await this.adminService.getAllComments({
      isApproved: false,
      page,
      limit,
    });

    return ApiResponse.paginated(res, result.comments, page, limit, result.total);
  });

  /**
   * POST /api/admin/comments/bulk-approve
   * Bulk approve multiple comments
   */
  bulkApproveComments = asyncHandler(async (req: Request, res: Response) => {
    const { commentIds } = req.body;

    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      throw new AppError('commentIds array is required', 400);
    }

    const result = await this.adminService.bulkApproveComments(commentIds);

    return ApiResponse.success(res, result, `${result.approved} comments approved`);
  });

  /**
   * DELETE /api/admin/comments/bulk-delete
   * Bulk delete multiple comments
   */
  bulkDeleteComments = asyncHandler(async (req: Request, res: Response) => {
    const { commentIds } = req.body;

    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      throw new AppError('commentIds array is required', 400);
    }

    const result = await this.adminService.bulkDeleteComments(commentIds);

    return ApiResponse.success(res, result, `${result.deleted} comments deleted`);
  });

  /**
   * GET /api/admin/flagged
   * Get flagged content
   */
  getFlaggedContent = asyncHandler(async (req: Request, res: Response) => {
    const content = await this.adminService.getFlaggedContent();

    return ApiResponse.success(res, content);
  });

  /**
   * GET /api/admin/health
   * Get system health
   */
  getSystemHealth = asyncHandler(async (req: Request, res: Response) => {
    const health = await this.adminService.getSystemHealth();

    return ApiResponse.success(res, health);
  });
}

export const adminController = new AdminController();
