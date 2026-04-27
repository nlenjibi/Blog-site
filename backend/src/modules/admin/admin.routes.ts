import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { UserRole } from '@/types';
import { asyncHandler } from '@/middleware/logger.middleware';

const router = Router();
const adminController = new AdminController();

/**
 * @route GET /api/admin/analytics
 * @desc Get analytics data
 * @access Admin only
 */
router.get(
  '/analytics',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(adminController.getAnalytics)
);

/**
 * @route GET /api/admin/dashboard
 * @desc Get dashboard statistics
 * @access Admin/Editor
 */
router.get(
  '/dashboard',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.EDITOR),
  asyncHandler(adminController.getDashboard)
);

/**
 * @route GET /api/admin/comments/pending
 * @desc Get pending comments
 * @access Admin/Editor
 */
router.get(
  '/comments/pending',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.EDITOR),
  asyncHandler(adminController.getPendingComments)
);

/**
 * @route POST /api/admin/comments/bulk-approve
 * @desc Bulk approve comments
 * @access Admin/Editor
 */
router.post(
  '/comments/bulk-approve',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.EDITOR),
  asyncHandler(adminController.bulkApproveComments)
);

/**
 * @route DELETE /api/admin/comments/bulk-delete
 * @desc Bulk delete comments
 * @access Admin/Editor
 */
router.delete(
  '/comments/bulk-delete',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(adminController.bulkDeleteComments)
);

/**
 * @route GET /api/admin/flagged
 * @desc Get flagged content
 * @access Admin only
 */
router.get(
  '/flagged',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(adminController.getFlaggedContent)
);

/**
 * @route GET /api/admin/health
 * @desc Get system health
 * @access Admin only
 */
router.get(
  '/health',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(adminController.getSystemHealth)
);

export default router;
