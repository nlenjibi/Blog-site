import { User, IUser } from '@/models/User.model';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '@/utils/error.util';
import { generateToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '@/utils/jwt.util';
import { emailService } from '@/utils/email.util';
import { cacheService, cacheKeys } from '@/utils/cache.util';
import { logger } from '@/utils/logger.util';
import { UserRole } from '@/types';

/**
 * AuthService handles all authentication business logic
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const { name, email, password, role = UserRole.USER } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Check if trying to assign elevated role (only admins can do this)
    if (role && !['user'].includes(role)) {
      throw new AppError('Invalid role assignment', 403);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const verificationToken = uuidv4();

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      emailVerificationToken: verificationToken,
      isVerified: true, // For MVP, skip email verification. Set to false to enable
    });

    // Send verification email (if not verified)
    if (!user.isVerified) {
      await emailService.sendVerificationEmail(user.email, user.name, verificationToken);
    }

    // Generate JWT tokens
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateToken(payload, process.env.JWT_EXPIRE || '1h');
    const refreshToken = generateRefreshToken({ userId: user._id });

    // Store refresh token in cache (Redis) for revocation capability
    await cacheService.set(`refreshToken:${user._id}`, refreshToken, 60 * 60 * 24 * 7); // 7 days

    // Return sanitized user + tokens
    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;

    logger.info('User registered successfully', { userId: user._id, email });

    return {
      user: sanitizedUser as IUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    // Find user with password field included
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT tokens
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateToken(payload, process.env.JWT_EXPIRE || '1h');
    const refreshToken = generateRefreshToken({ userId: user._id });

    // Store refresh token
    await cacheService.set(`refreshToken:${user._id}`, refreshToken, 60 * 60 * 24 * 7);

    // Return sanitized user
    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;

    logger.info('User logged in', { userId: user._id, email });

    return {
      user: sanitizedUser as IUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    const userId = decoded.userId;

    // Check if refresh token exists in cache
    const storedToken = await cacheService.get<string>(`refreshToken:${userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Get user
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Generate new tokens
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateToken(payload, process.env.JWT_EXPIRE || '1h');
    const newRefreshToken = generateRefreshToken({ userId: user._id });

    // Update stored refresh token
    await cacheService.set(`refreshToken:${user._id}`, newRefreshToken, 60 * 60 * 24 * 7);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(userId: string): Promise<void> {
    await cacheService.del(`refreshToken:${userId}`);
    logger.info('User logged out', { userId });
  }

  /**
   * Get current user by ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    const user = await User.findById(userId);
    if (!user) {
      return null;
    }
    const userObj = user.toObject();
    delete userObj.password;
    return userObj as IUser;
  }

  /**
   * Forgot password - generate reset token
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send email
    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Invalidate all refresh tokens
    await cacheService.del(`refreshToken:${user._id}`);

    logger.info('Password reset successful', { userId: user._id });
  }

  /**
   * Validate email with token
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      throw new AppError('Invalid verification token', 400);
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
  }

  /**
   * Change password (for logged-in user)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash and update
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Invalidate all sessions
    await cacheService.del(`refreshToken:${userId}`);

    logger.info('Password changed', { userId });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: { name?: string; bio?: string; avatar?: string }): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userObj = user.toObject();
    delete userObj.password;

    return userObj as IUser;
  }

  /**
   * Validate access token (for middleware)
   */
  decodeToken(token: string): TokenPayload {
    const decoded = verifyToken(token);
    return decoded as TokenPayload;
  }
}

export const authService = new AuthService();
