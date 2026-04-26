import { Request } from 'express';
import { Post, IPost } from '@/models/Post.model';
import { Category } from '@/models/Category.model';
import { Tag } from '@/models/Tag.model';
import { User } from '@/models/User.model';
import { AppError } from '@/utils/error.util';
import { cacheService, cacheKeys } from '@/utils/cache.util';
import { logger } from '@/utils/logger.util';
import { PostStatus } from '@/types';

/**
 * PostsService handles all blog post business logic
 */
export class PostsService {
  /**
   * Generate SEO-friendly slug
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Calculate reading time (words per minute = 200)
   */
  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  }

  /**
   * Get or create tags by name
   */
  private async resolveTags(tagNames: string[]): Promise<string[]> {
    const tags: string[] = [];

    for (const name of tagNames) {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      let tag = await Tag.findOne({ slug });
      if (!tag) {
        tag = await Tag.create({
          name,
          slug,
          usageCount: 0,
        });
      }
      tags.push(tag._id);
    }

    return tags;
  }

  /**
   * Create a new post
   */
  async createPost(data: {
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    categoryId: string;
    tags?: string[];
    published?: boolean;
    featured?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    metaKeywords?: string;
    authorId: string;
  }): Promise<IPost> {
    const slug = this.generateSlug(data.title);

    // Check slug uniqueness
    const existing = await Post.findOne({ slug });
    if (existing) {
      throw new AppError('A post with this title already exists', 409);
    }

    // Verify category exists
    const category = await Category.findById(data.categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Resolve tags
    const tagIds = data.tags ? await this.resolveTags(data.tags) : [];

    // Calculate reading time
    const readingTime = this.calculateReadingTime(data.content);

    // Create post
    const post = await Post.create({
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || data.content.substring(0, k),
      coverImage: data.coverImage || '',
      published: data.published || false,
      featured: data.featured || false,
      publishedAt: data.published ? new Date() : null,
      author: data.authorId,
      category: data.categoryId,
      tags: tagIds,
      readingTime,
      seoTitle: data.seoTitle || data.title,
      seoDescription: data.seoDescription || (data.excerpt || data.content.substring(0, 160)),
      metaKeywords: data.metaKeywords || '',
    });

    // Update tag usage counts
    await Tag.updateMany(
      { _id: { $in: tagIds } },
      { $inc: { usageCount: 1 } }
    );

    // Clear relevant caches
    await cacheService.delPattern(cacheKeys.postsList(1, 10, '*'));
    await cacheService.delPattern('posts:*');

    logger.info('Post created', { postId: post._id, slug: post.slug, author: data.authorId });

    return post;
  }

  /**
   * Get single post by slug (with all relations)
   */
  async getPostBySlug(slug: string, currentUserId?: string): Promise<{
    post: IPost & { author: any; category: any; tags: any[]; comments: any[]; likes: any[]; bookmarks: any[] }; currentUserId?: string
  }> {
    const cacheKey = cacheKeys.post(slug);
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const post = await Post.findOne({ slug, published: true })
      .populate('author', 'name avatar bio')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug')
      .populate('comments', {
        where: { parent: null, isDeleted: false, isApproved: true },
        options: { sort: { createdAt: -1 } },
        populate: {
          path: 'author',
          select: 'name avatar',
        },
      });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const postObject = post.toObject();

    // Add user-specific info if logged in
    if (currentUserId) {
      const userLiked = await Post.exists({
        _id: post._id,
        likes: { $elemMatch: { user: currentUserId } },
      });

      const userBookmarked = await Bookmark.exists({
        post: post._id,
        user: currentUserId,
      });

      postObject.userLiked = !!userLiked;
      postObject.userBookmarked = !!userBookmarked;
    } else {
      postObject.userLiked = false;
      postObject.userBookmarked = false;
    }

    // Cache for 5 minutes
    await cacheService.set(cacheKey, postObject, 300);

    return postObject;
  }

  /**
   * Get single post by ID (for admin/editor)
   */
  async getPostById(postId: string): Promise<IPost | null> {
    return await Post.findById(postId)
      .populate('author', 'name email')
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('comments');
  }

  /**
   * Update post
   */
  async updatePost(postId: string, data: Partial<CreatePostDto>, userId: string, userRole: string): Promise<IPost> {
    const post = await Post.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Check ownership or admin/editor role
    if (post.author.toString() !== userId && !['admin', 'editor'].includes(userRole)) {
      throw new AppError('Not authorized to edit this post', 403);
    }

    // If published status is changing, handle publishedAt
    if (data.published !== undefined && data.published && !post.published) {
      data.publishedAt = new Date();
    }

    // Update slug if title changed
    if (data.title && data.title !== post.title) {
      data.slug = this.generateSlug(data.title);
    }

    // Update tags if provided
    if (data.tags) {
      data.tags = await this.resolveTags(data.tags);
    }

    // Calculate reading time if content changed
    if (data.content && data.content !== post.content) {
      data.readingTime = this.calculateReadingTime(data.content);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate('author', 'name avatar')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug');

    if (!updatedPost) {
      throw new AppError('Failed to update post', 500);
    }

    // Clear caches
    await cacheService.del(cacheKeys.post(updatedPost.slug));
    await cacheService.delPattern(cacheKeys.postsList(1, 10, '*'));

    logger.info('Post updated', { postId, userId });

    return updatedPost;
  }

  /**
   * Delete post
   */
  async deletePost(postId: string, userId: string, userRole: string): Promise<void> {
    const post = await Post.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Check ownership or admin role
    if (post.author.toString() !== userId && userRole !== 'admin') {
      throw new AppError('Not authorized to delete this post', 403);
    }

    // Soft delete if post has relations (comments, likes, etc.)
    // Hard delete if no relations
    const hasRelations = await Promise.all([
      Comment.exists({ post: postId }),
      Like.exists({ post: postId }),
      Bookmark.exists({ post: postId }),
    ]);

    const hasAnyRelation = hasRelations.some(Boolean);

    if (hasAnyRelation) {
      // Soft delete
      await Post.findByIdAndUpdate(postId, {
        $set: { published: false, isActive: false, title: `[DELETED] ${post.title}` },
      });
    } else {
      // Hard delete
      await Post.findByIdAndDelete(postId);
    }

    // Clear caches
    await cacheService.del(cacheKeys.post(post.slug));
    await cacheService.delPattern('posts:*');

    logger.info('Post deleted', { postId, userId });
  }

  /**
   * Get all posts with pagination and filters
   */
  async getPosts(filters: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    author?: string;
    featured?: boolean;
    published?: boolean;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<{
    posts: any[];
    total: number;
    totalPages: number;
    page: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { isActive: true };

    if (filters.published !== undefined) {
      query.published = filters.published;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.tag) {
      query.tags = filters.tag;
    }

    if (filters.author) {
      query.author = filters.author;
    }

    if (filters.featured !== undefined) {
      query.featured = filters.featured;
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { excerpt: { $regex: filters.search, $options: 'i' } },
        { content: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Build sort
    const sortOption: Record<string, 'asc' | 'desc'> = {};
    sortOption[filters.sortBy || 'publishedAt'] = filters.order || 'desc';

    // Get paginated results
    const posts = await Post.find(query)
      .populate('author', 'name avatar')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      posts,
      total,
      totalPages,
      page,
    };
  }

  /**
   * Increment view count
   */
  async incrementViews(postId: string): Promise<void> {
    await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });
  }

  /**
   * Get popular posts
   */
  async getPopularPosts(limit: number = 5, period: 'week' | 'month' | 'all' = 'all'): Promise<IPost[]> {
    const query: any = { published: true, isActive: true };

    if (period === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query.publishedAt = { $gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      query.publishedAt = { $gte: monthAgo };
    }

    const cacheKey = `posts:popular:${period}`;
    const cached = await cacheService.get<IPost[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const posts = await Post.find(query)
      .sort({ views: -1 })
      .limit(limit)
      .populate('author', 'name avatar')
      .populate('category', 'name slug color');

    await cacheService.set(cacheKey, posts, 3600); // Cache 1 hour

    return posts;
  }

  /**
   * Get featured posts
   */
  async getFeaturedPosts(limit: number = 3): Promise<IPost[]> {
    const cacheKey = `posts:featured:${limit}`;
    const cached = await cacheService.get<IPost[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const posts = await Post.find({ featured: true, published: true, isActive: true })
      .populate('author', 'name avatar')
      .populate('category', 'name slug color')
      .sort({ publishedAt: -1 })
      .limit(limit);

    await cacheService.set(cacheKey, posts, 1800); // Cache 30 mins

    return posts;
  }

  /**
   * Get post counts by category
   */
  async getPostCountsByCategory(): Promise<Array<{ category: string; count: number }>> {
    const cacheKey = 'posts:counts:category';
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await Post.aggregate([
      { $match: { published: true, isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    await cacheService.set(cacheKey, result, 600); // Cache 10 mins

    return result;
  }
}

export const postsService = new PostsService();
