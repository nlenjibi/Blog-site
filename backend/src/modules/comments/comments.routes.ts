import { Router } from 'express';
import { CommentsController } from './comments.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { UserRole } from '@/types';
import { asyncHandler } from '@/middleware/logger.middleware';

const router = Router();
const commentsController = new CommentsController();

/**
 * @route POST /api/comments
 * @desc Create comment
 * @access Private (any authenticated user)
 */
router.post(
  '/',
  authenticate,
  validate(createCommentSchema),
  asyncHandler(commentsController.createComment)
);

/**
 * @route GET /api/comments/post/:postId
 * @desc Get comments for a post
 * @access Public
 */
router.get(
  '/post/:postId',
  validate(getCommentsSchema),
  asyncHandler(commentsController.getComments)
);

/**
 * @route PATCH /api/comments/:id
 * @desc Update comment
 * @access Private (comment author only)
 */
router.patch(
  '/:id',
  authenticate,
  validate(updateCommentSchema),
  asyncHandler(commentsController.updateComment)
);

/**
 * @route DELETE /api/comments/:id
 * @desc Delete comment
 * @access Private (comment author)
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(commentsController.deleteComment)
);

/**
 * @route POST /api/admin/comments/:id/approve
 * @desc Approve comment (moderation)
 * @access Admin/Editor only
 */
router.post(
  '/admin/comments/:id/approve',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.EDITOR),
  asyncHandler(commentsController.approveComment)
);

/**
 * @route DELETE /api/admin/comments/:id/reject
 * @desc Reject comment
 * @access Admin only
 */
router.delete(
  '/admin/comments/:id/reject',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(commentsController.rejectComment)
);

/**
 * @route GET /api/admin/comments/pending
 * @desc Get pending comments
 * @access Admin/Editor only
 */
router.get(
  '/admin/comments/pending',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.EDITOR),
  asyncHandler(commentsController.getPendingComments)
);

export default router;
