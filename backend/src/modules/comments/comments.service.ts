import { Comment, IComment } from '@/models/Comment.model';
import { Post } from '@/models/Post.model';
import { User } from '@/models/User.model';
import { AppError } from '@/utils/error.util';
import { cacheService } from '@/utils/cache.util';
import { logger } from '@/utils/logger.util';

/**
 * CommentsService handles comment-related business logic
 */
export class CommentsService {
  /**
   * Create a new comment
   */
  async createComment(data: {
    content: string;
    postId: string;
    authorId: string;
    parentId?: string;
  }): Promise<IComment> {
    const { content, postId, authorId, parentId } = data;

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Handle nested comment
    if (parentId) {
      const parent = await Comment.findById(parentId);
      if (!parent || parent.post.toString() !== postId) {
        throw new AppError('Parent comment not found or does not belong to this post', 404);
      }

      if (parent.depth >= 3) {
        throw new AppError('Maximum nesting depth exceeded', 400);
      }
    }

    // Determine if auto-approve (configurable based on user role)
    const user = await User.findById(authorId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isApproved = user.role === 'admin' || user.role === 'editor' || user.role === 'author';

    const comment = await Comment.create({
      content,
      post: postId,
      author: authorId,
      parent: parentId || null,
      isApproved,
      depth: parentId ? 1 : 0, // Will be incremented by pre-save hook if parentId exists
    });

    // Update post's comment count cache
    await this.updatePostCommentCount(postId);

    // Clear post cache so new comments appear
    const postSlug = (await Post.findById(postId))?.slug;
    if (postSlug) {
      await cacheService.del(`post:${postSlug}`);
    }

    logger.info('Comment created', { commentId: comment._id, postId, authorId });

    return comment;
  }

  /**
   * Get comments for a post
   */
  async getPostComments(postId: string, page: number = 1, limit: number = 20): Promise<{
    comments: (IComment & { author: any })[];
    total: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({
        post: postId,
        parent: null,
        isDeleted: false,
      })
        .populate('author', 'name avatar role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({
        post: postId,
        parent: null,
        isDeleted: false,
      }),
    ]);

    // Populate replies for each comment
    for (const comment of comments) {
      const replies = await Comment.find({
        parent: comment._id,
        isDeleted: false,
        isApproved: true,
      })
        .populate('author', 'name avatar')
        .sort({ createdAt: 1 })
        .lean();

      comment.replies = replies;
    }

    const totalPages = Math.ceil(total / limit);

    return {
      comments,
      total,
      totalPages,
    };
  }

  /**
   * Update comment
   */
  async updateComment(commentId: string, content: string, userId: string, userRole: string): Promise<IComment> {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Check ownership or admin/editor role
    if (comment.author.toString() !== userId && !['admin', 'editor'].includes(userRole)) {
      throw new AppError('Not authorized to edit this comment', 403);
    }

    comment.content = content;
    await comment.save();

    logger.info('Comment updated', { commentId, userId });

    return comment;
  }

  /**
   * Delete comment (soft delete)
   */
  async deleteComment(commentId: string, userId: string, userRole: string): Promise<void> {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Check ownership or admin role
    if (comment.author.toString() !== userId && userRole !== 'admin') {
      throw new AppError('Not authorized to delete this comment', 403);
    }

    // Soft delete
    comment.isDeleted = true;
    await comment.save();

    // Update post comment count
    await this.updatePostCommentCount(comment.post.toString());

    logger.info('Comment deleted', { commentId, userId });
  }

  /**
   * Approve comment (admin/editor only)
   */
  async approveComment(commentId: string): Promise<IComment> {
    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { $set: { isApproved: true } },
      { new: true }
    )
      .populate('author', 'name avatar')
      .lean();

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    logger.info('Comment approved', { commentId });

    return comment;
  }

  /**
   * Reject/delete comment (admin only)
   */
  async rejectComment(commentId: string): Promise<void> {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    await comment.deleteOne();

    // Update post comment count
    await this.updatePostCommentCount(comment.post.toString());

    logger.info('Comment rejected', { commentId });
  }

  /**
   * Get pending comments (for moderation)
   */
  async getPendingComments(page: number = 1, limit: number = 50): Promise<{
    comments: (IComment & { author: any; post: any })[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ isApproved: false, isDeleted: false })
        .populate('author', 'name email')
        .populate('post', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ isApproved: false, isDeleted: false }),
    ]);

    return { comments, total };
  }

  /**
   * Update cached comment count for a post
   */
  private async updatePostCommentCount(postId: string): Promise<void> {
    const count = await Comment.countDocuments({
      post: postId,
      parent: null,
      isDeleted: false,
      isApproved: true,
    });

    // Could add a field on Post for comment count
    // Or cache separately
  }
}

export const commentsService = new CommentsService();
