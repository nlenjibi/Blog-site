import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { ApiResponse } from '@/utils/response.util';
import { AppError } from '@/utils/error.util';
import { asyncHandler } from '@/middleware/logger.middleware';
import { authorize } from '@/middleware/auth.middleware';
import { UserRole } from '@/types';

/**
 * UsersController handles HTTP requests for user endpoints
 */
export class UsersController {
  private usersService: UsersService;

  constructor() {
    this.usersService = new UsersService();
  }

  /**
   * GET /api/users/profile
   * Get current user's profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const user = await this.usersService.getUserProfile(req.user.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return ApiResponse.success(res, user);
  });

  /**
   * GET /api/users/:id
   * Get user by ID (public)
   */
  getUserById = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    const user = await this.usersService.getUserProfile(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return ApiResponse.success(res, user);
  });

  /**
   * PATCH /api/users/profile
   * Update current user profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { name, bio, avatar } = req.body;
    const user = await this.usersService.updateProfile(req.user.userId, { name, bio, avatar });

    return ApiResponse.success(res, user, 'Profile updated');
  });

  /**
   * GET /api/admin/users
   * Get all users (admin only)
   */
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    // authorize middleware must be applied at route level for admin role
    const users = await this.usersService.getAllUsers({
      role: req.query.role as string,
      isActive: req.query.isActive as boolean | undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      search: req.query.search as string,
    });

    return ApiResponse.paginated(
      res,
      users.users,
      users.page,
      users.totalPages < (parseInt(req.query.limit as string) || 20) ? Math.ceil(users.total / (parseInt(req.query.limit as string) || 20)) : users.totalPages,
      users.total
    );
  });

  /**
   * PATCH /api/admin/users/:id/role
   * Update user role (admin only)
   */
  updateUserRole = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const { role } = req.body;
    const { id } = req.params;

    // Prevent self-demotion
    if (req.user?.userId === id && req.user.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
      throw new AppError('Cannot demote yourself', 403);
    }

    const user = await this.usersService.updateUserRole(id, role);

    return ApiResponse.success(res, user, 'User role updated');
  });

  /**
   * DELETE /api/admin/users/:id
   * Delete user (admin only)
   */
  deleteUser = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user?.userId === id) {
      throw new AppError('Cannot delete own account', 403);
    }

    await this.usersService.deleteUser(id);

    return ApiResponse.success(res, null, 'User deleted');
  });

  /**
   * GET /api/admin/users/stats
   * Get user statistics (admin only)
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.usersService.getUserStats();

    return ApiResponse.success(res, stats);
  });
}

export const usersController = new UsersController();
