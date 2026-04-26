import { Router } from 'express';
import { UsersController } from './users.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { UserRole } from '@/types';
import { asyncHandler } from '@/middleware/logger.middleware';

const router = Router();
const usersController = new UsersController();

/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticate, asyncHandler(usersController.getProfile));

/**
 * @route PATCH /api/users/profile
 * @desc Update current user profile
 * @access Private
 */
router.patch('/profile', authenticate, asyncHandler(usersController.updateProfile));

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Public
 */
router.get('/:id', asyncHandler(usersController.getUserById));

/**
 * Admin-only routes below
 */

/**
 * @route GET /api/admin/users
 * @desc Get all users (with filters)
 * @access Admin only
 */
router.get(
  '/admin/users',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(usersController.getAllUsers)
);

/**
 * @route PATCH /api/admin/users/:id/role
 * @desc Update user role
 * @access Admin only
 */
router.patch(
  '/admin/users/:id/role',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(usersController.updateUserRole)
);

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete user
 * @access Admin only
 */
router.delete(
  '/admin/users/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(usersController.deleteUser)
);

/**
 * @route GET /api/admin/users/stats
 * @desc Get user statistics
 * @access Admin only
 */
router.get(
  '/admin/users/stats',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(usersController.getStats)
);

export default router;
