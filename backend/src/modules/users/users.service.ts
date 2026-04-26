import { User, IUser } from '@/models/User.model';
import { AppError } from '@/utils/error.util';
import { cacheService, cacheKeys } from '@/utils/cache.util';
import { logger } from '@/utils/logger.util';

/**
 * UsersService handles user-related business logic
 */
export class UsersService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    // Check cache first
    const cacheKey = cacheKeys.user(userId);
    const cached = await cacheService.get<IUser>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await User.findById(userId);
    if (!user) {
      return null;
    }

    const userObj = user.toObject();
    delete userObj.password;

    // Cache for 5 minutes
    await cacheService.set(cacheKey, userObj, 300);

    return userObj as IUser;
  }

  /**
   * Get user profile (public info)
   */
  async getUserProfile(userId: string): Promise<{ user: IUser; postsCount: number } | null> {
    const user = await User.findById(userId)
      .populate('posts', '_id title slug publishedAt')
      .select('-password -emailVerificationToken -passwordResetToken');

    if (!user) {
      return null;
    }

    return {
      user: user.toObject() as IUser,
      postsCount: user.posts?.length || 0,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: { name?: string; bio?: string; avatar?: string }): Promise<IUser> {
    const allowedUpdates = ['name', 'bio', 'avatar'];
    const updates: Record<string, any> = {};

    allowedUpdates.forEach((field) => {
      if (data[field as keyof typeof data] !== undefined) {
        updates[field] = data[field as keyof typeof data];
      }
    });

    const user = await User.findByIdAndUpdate(userId, { $set: updates }, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Invalidate cache
    await cacheService.del(cacheKeys.user(userId));

    return user.toObject() as IUser;
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(filters?: {
    role?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filters?.role) {
      query.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map((u) => u.toObject() as IUser),
      total,
      page,
      totalPages,
    };
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: string): Promise<IUser> {
    const allowedRoles = ['admin', 'editor', 'author', 'user'];

    if (!allowedRoles.includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { role } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Invalidate cache
    await cacheService.del(cacheKeys.user(userId));

    logger.info('User role updated', { userId, newRole: role });

    return user.toObject() as IUser;
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(userId: string): Promise<void> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Invalidate cache
    await cacheService.del(cacheKeys.user(userId));

    logger.info('User deactivated', { userId });
  }

  /**
   * Delete user permanently
   */
  async deleteUser(userId: string): Promise<void> {
    // Optional: Anonymize user data instead of hard delete
    const result = await User.findByIdAndDelete(userId);

    if (!result) {
      throw new AppError('User not found', 404);
    }

    // Clear cache
    await cacheService.del(cacheKeys.user(userId));
    await cacheService.delPattern(`refreshToken:${userId}`);

    logger.info('User deleted', { userId });
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    usersByRole: Record<string, number>;
    recentSignups: number;
  }> {
    const totalUsers = await User.countDocuments();
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    return {
      totalUsers,
      usersByRole: usersByRole.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {} as Record<string, number>),
      recentSignups,
    };
  }
}

export const usersService = new UsersService();
