import { Request, Response, NextFunction } from 'express';
import { PostsService } from './posts.service';
import { ApiResponse } from '@/utils/response.util';
import { AppError } from '@/utils/error.util';
import { asyncHandler } from '@/middleware/logger.middleware';
import { createPostSchema, updatePostSchema, getPostsSchema } from './posts.validation';
import { UserRole } from '@/types';

/**
 * PostsController handles HTTP requests for blog post endpoints
 */
export class PostsController {
  private postsService: PostsService;

  constructor() {
    this.postsService = new PostsService();
  }

  /**
   * GET /api/posts
   * Get all posts with pagination and filters
   */
  getPosts = asyncHandler(async (req: Request, res: Response) => {
    // Validation happens in middleware
    const query = req.query as any;

    const result = await this.postsService.getPosts({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      category: query.category,
      tag: query.tag,
      author: query.author,
      featured: query.featured as boolean | undefined,
      published: query.published !== undefined ? JSON.parse(query.published) : undefined,
      search: query.search,
      sortBy: query.sortBy,
      order: query.order,
    });

    return ApiResponse.paginated(
      res,
      result.posts,
      result.page,
      result.totalPages,
      result.total
    );
  });

  /**
   * GET /api/posts/:slug
   * Get single published post
   */
  getPostBySlug = asyncHandler(async (req: Request<{ slug: string }>, res: Response) => {
    const { slug } = req.params;
    const currentUserId = req.user?.userId;

    const post = await this.postsService.getPostBySlug(slug, currentUserId);

    // Track view
    if (req.user?.userId) {
      await this.postsService.incrementViews(post._id);
    }

    return ApiResponse.success(res, post);
  });

  /**
   * GET /api/posts/id/:id
   * Get post by ID (for admin)
   */
  getPostById = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const { includeUnpublished } = req.query;

    const post = await this.postsService.getPostById(id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Check if unpublished post can be viewed
    if (!post.published && includeUnpublished !== 'true') {
      throw new AppError('Post not found', 404);
    }

    return ApiResponse.success(res, post);
  });

  /**
   * POST /api/posts
   * Create new post
   */
  createPost = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError('Authentication required', 401);
    }

    const body = req.body as any; // Validated by middleware

    const post = await this.postsService.createPost({
      ...body,
      authorId: req.user.userId,
    });

    return ApiResponse.success(res, post, 'Post created', 201);
  });

  /**
   * PATCH /api/posts/:id
   * Update post
   */
  updatePost = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const body = req.body as any;

    const post = await this.postsService.updatePost(
      id,
      body,
      req.user.userId,
      req.user.role
    );

    return ApiResponse.success(res, post, 'Post updated');
  });

  /**
   * DELETE /api/posts/:id
   * Delete post
   */
  deletePost = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    await this.postsService.deletePost(id, req.user.userId, req.user.role);

    return ApiResponse.success(res, null, 'Post deleted');
  });

  /**
   * GET /api/posts/:id/comments
   * Get comments for post
   */
  getPostComments = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const { Comment } = require('@/models/Comment.model');
    const { id } = req.params;

    const comments = await Comment.find({
      post: id,
      parent: null,
      isDeleted: false,
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .select('-isDeleted');

    return ApiResponse.success(res, comments);
  });

  /**
   * GET /api/posts/:id/related
   * Get related posts
   */
  getRelatedPosts = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    const post = await Post.findById(id)
      .populate('category')
      .populate('tags');

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const related = await Post.find({
      _id: { $ne: id },
      published: true,
      isActive: true,
      $or: [
        { category: post.category },
        { tags: { $in: post.tags.map((t: any) => (typeof t === 'object' ? t._id : t)) } },
      ],
    })
      .limit(parseInt(limit as string))
      .populate('author', 'name avatar')
      .populate('category', 'name slug color');

    return ApiResponse.success(res, related);
  });
}

export const postsController = new PostsController();
