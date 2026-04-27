import { User } from '@/models/User.model';
import { Post } from '@/models/Post.model';
import { Comment } from '@/models/Comment.model';
import { PostView } from '@/models/PostView.model';
import { cacheService } from '@/utils/cache.util';
import { logger } from '@/utils/logger.util';
import { AppError } from '@/utils/error.util';

/**
 * AdminService handles admin-level operations
 */
export class AdminService {
  /**
   * Get dashboard overview statistics
   */
  async getDashboardStats(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalUsers: number;
    totalComments: number;
    pendingComments: number;
    totalViews: number;
    recentPosts: any[];
    recentUsers: any[];
  }> {
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalUsers,
      totalComments,
      pendingComments,
      totalViews,
      recentPosts,
      recentUsers,
    ] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ published: true }),
      Post.countDocuments({ published: false }),
      User.countDocuments(),
      Comment.countDocuments({ isDeleted: false }),
      Comment.countDocuments({ isApproved: false, isDeleted: false }),
      Post.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Post.find({ published: true })
        .populate('author', 'name')
        .sort({ publishedAt: -1 })
        .limit(5)
        .select('title slug publishedAt views'),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt'),
    ]);

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalUsers,
      totalComments,
      pendingComments,
      totalViews: totalViews[0]?.total || 0,
      recentPosts: JSON.parse(JSON.stringify(recentPosts)),
      recentUsers: JSON.parse(JSON.stringify(recentUsers)),
    };
  }

  /**
   * Get analytics data for charts
   */
  async getAnalytics(period: 'week' | 'month' = 'week'): Promise<{
    viewsByDate: Array<{ date: string; views: number }>;
    postsByCategory: Array<{ category: string; count: number }>;
    userGrowth: Array<{ date: string; count: number }>;
    engagement: {
      avgReadingTime: number;
      commentsPerPost: number;
      likesPerPost: number;
    };
  }> {
    const daysAgo = period === 'week' ? 7 : 30;
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Views by date
    const viewsByDate = await PostView.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          views: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Posts by category
    const postsByCategory = await Post.aggregate([
      { $match: { published: true, isActive: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData',
        },
      },
      { $unwind: '$categoryData' },
      {
        $group: {
          _id: '$categoryData.name',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // User growth (new users per day)
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Engagement metrics
    const totalPosts = await Post.countDocuments({ published: true });
    const totalComments = await Comment.countDocuments({ isDeleted: false });
    const totalLikes = await Post.countDocuments({}); // Placeholder

    const engagement = {
      avgReadingTime: 0, // Calculate from Post.avgReadingTime if field exists
      commentsPerPost: totalPosts > 0 ? totalComments / totalPosts : 0,
      likesPerPost: 0,
    };

    return {
      viewsByDate: viewsByDate.map((v) => ({
        date: v._id,
        views: v.views,
      })),
      postsByCategory: postsByCategory.map((p) => ({
        category: p._id,
        count: p.count,
      })),
      userGrowth: userGrowth.map((u) => ({
        date: u._id,
        count: u.count,
      })),
      engagement,
    };
  }

  /**
   * Get all comments for moderation
   */
  async getAllComments(filters: { isApproved?: boolean; page?: number; limit?: number }): Promise<{
    comments: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: false };
    if (filters.isApproved !== undefined) {
      query.isApproved = filters.isApproved;
    }

    const [comments, total] = await Promise.all([
      Comment.find(query)
        .populate('author', 'name email')
        .populate('post', 'title slug')
        .sort({ createdAt: filters.isApproved === false ? 1 : -1 })
        .skip(skip)
        .limit(limit),
      Comment.countDocuments(query),
    ]);

    return {
      comments: JSON.parse(JSON.stringify(comments)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Bulk approve comments
   */
  async bulkApproveComments(commentIds: string[]): Promise<{ approved: number }> {
    const result = await Comment.updateMany(
      { _id: { $in: commentIds }, isDeleted: false },
      { $set: { isApproved: true } }
    );

    logger.info('Bulk comment approval', { count: result.modifiedCount });

    return { approved: result.modifiedCount };
  }

  /**
   * Bulk delete comments
   */
  async bulkDeleteComments(commentIds: string[]): Promise<{ deleted: number }> {
    const result = await Comment.updateMany(
      { _id: { $in: commentIds } },
      { $set: { isDeleted: true } }
    );

    logger.info('Bulk comment deletion', { count: result.modifiedCount });

    return { deleted: result.modifiedCount };
  }

  /**
   * Flagged posts/content
   */
  async getFlaggedContent(): Promise<any[]> {
    // In a full implementation, you'd have a "flagged" field on posts/comments
    // For now, return posts with excessive reports (hypothetical)
    const flaggedPosts = await Post.find({ isActive: false, published: true });
    return JSON.parse(JSON.stringify(flaggedPosts));
  }

  /**
   * System health metrics
   */
  async getSystemHealth(): Promise<{
    database: string;
    cache: string;
    api: { uptime: string; memoryUsage: string };
    uptime: string;
  }> {
    // Simple health checks
    const dbConnected = await Post.findOne().then(() => true).catch(() => false);
    const cacheHealthy = await cacheService.exists('test');

    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    return {
      database: dbConnected ? 'healthy' : 'disconnected',
      cache: cacheHealthy ? 'healthy' : 'unhealthy',
      api: {
        uptime: `${hours}h ${minutes}m`,
        memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      },
      uptime: `${hours}h ${minutes}m`,
    };
  }
}

export const adminService = new AdminService();
