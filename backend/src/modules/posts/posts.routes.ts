import { Router } from 'express';
import { PostsController } from './posts.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { UserRole } from '@/types';
import { asyncHandler } from '@/middleware/logger.middleware';

const router = Router();
const postsController = new PostsController();

// Import models
import { Post } from '@/models/Post.model';
import { Comment } from '@/models/Comment.model';

/**
 * @route GET /api/posts
 * @desc Get all published posts with pagination and filters
 * @access Public
 */
router.get('/', validate(getPostsSchema), asyncHandler(postsController.getPosts));

/**
 * @route GET /api/posts/:slug
 * @desc Get single post by slug
 * @access Public
 */
router.get('/:slug', validate(getPostsSchema), asyncHandler(postsController.getPostBySlug));

/**
 * @route GET /api/posts/id/:id
 * @desc Get post by ID (for admin/editor)
 * @access Private (any authenticated user can view, but will filter unpublished)
 */
router.get('/id/:id', authenticate, asyncHandler(postsController.getPostById));

/**
 * @route POST /api/posts
 * @desc Create new post
 * @access Private (AUTHOR, EDITOR, ADMIN)
 */
router.post(
  '/',
  authenticate,
  validate(createPostSchema),
  asyncHandler(postsController.createPost)
);

/**
 * @route PATCH /api/posts/:id
 * @desc Update post
 * @access Private (owner or ADMIN/EDITOR)
 */
router.patch(
  '/:id',
  authenticate,
  validate(updatePostSchema),
  asyncHandler(postsController.updatePost)
);

/**
 * @route DELETE /api/posts/:id
 * @desc Delete post
 * @access Private (owner or ADMIN)
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(postsController.deletePost)
);

/**
 * @route GET /api/posts/:id/comments
 * @desc Get comments for post
 * @access Public
 */
router.get('/:id/comments', validate(getPostsSchema), asyncHandler(postsController.getPostComments));

/**
 * @route GET /api/posts/:id/related
 * @desc Get related posts
 * @access Public
 */
router.get('/:id/related', validate(getPostsSchema), asyncHandler(postsController.getRelatedPosts));

/**
 * @route GET /api/posts/featured
 * @desc Get featured posts
 * @access Public
 */
router.get('/featured/list', asyncHandler(async (req: res) => {
  const featured = await postsController['getFeaturedPosts']?.();
  // Direct service call if needed
  return ApiResponse.success(res, featured);
}));

export default router;
