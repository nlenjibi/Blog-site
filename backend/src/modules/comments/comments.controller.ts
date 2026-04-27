import { Request, Response, NextFunction } from 'express';
import { CommentsService } from './comments.service';
import { ApiResponse } from '@/utils/response.util';
import { AppError } from '@/utils/error.util';
import { asyncHandler } from '@/middleware/logger.middleware';
import { createCommentSchema, updateCommentSchema, getCommentsSchema } from './comments.validation';

/**
 * CommentsController handles HTTP requests for comment endpoints
 */
export class CommentsController {
  private commentsService: CommentsService;

  constructor() {
    this.commentsService = new CommentsService();
  }

  /**
   * POST /api/comments
   * Create a new comment
   */
  createComment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError('Authentication required', 401);
    }

    const { content, postId, parentId } = req.body;

    const comment = await this.commentsService.createComment({
      content,
      postId,
      authorId: req.user.userId,
      parentId,
    });

    return ApiResponse.success(res, comment, 'Comment created', 201);
  });

  /**
   * GET /api/comments/post/:postId
   * Get comments for a post
   */
  getComments = asyncHandler(async (req: Request<{ postId: string }>, res: Response) => {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await this.commentsService.getPostComments(postId, page, limit);

    return ApiResponse.paginated(res, result.comments, page, limit, result.total);
  });

  /**
   * PATCH /api/comments/:id
   * Update comment
   */
  updateComment = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const { content } = req.body;

    const comment = await this.commentsService.updateComment(
      id,
      content,
      req.user.userId,
      req.user.role
    );

    return ApiResponse.success(res, comment, 'Comment updated');
  });

  /**
   * DELETE /api/comments/:id
   * Delete comment
   */
  deleteComment = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    await this.commentsService.deleteComment(id, req.user.userId, req.user.role);

    return ApiResponse.success(res, null, 'Comment deleted');
  });

  /**
   * POST /api/admin/comments/:id/approve
   * Approve comment (admin/editor only)
   */
  approveComment = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    // authorize middleware should be applied at route level
    const { id } = req.params;

    const comment = await this.commentsService.approveComment(id);

    return ApiResponse.success(res, comment, 'Comment approved');
  });

  /**
   * DELETE /api/admin/comments/:id/reject
   * Reject comment (admin only)
   */
  rejectComment = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    await this.commentsService.rejectComment(id);

    return ApiResponse.success(res, null, 'Comment rejected');
  });

  /**
   * GET /api/admin/comments/pending
   * Get pending comments for moderation
   */
  getPendingComments = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await this.commentsService.getPendingComments(page, limit);

    return ApiResponse.paginated(res, result.comments, page, limit, result.total);
  });
}

export const commentsController = new CommentsController();
