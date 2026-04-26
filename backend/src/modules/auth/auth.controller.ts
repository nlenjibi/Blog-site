import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '@/utils/response.util';
import { AppError } from '@/utils/error.util';
import { asyncHandler } from '@/middleware/logger.middleware';
import { RegisterDto, LoginDto, RefreshTokenDto } from './auth.validation';

/**
 * AuthController handles HTTP requests for authentication endpoints
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /api/auth/register
   * Register a new user
   */
  register = asyncHandler(async (req: Request<RegisterDto>, res: Response) => {
    const { name, email, password, confirmPassword, role } = req.body;

    // Confirm password match (additional client-side check)
    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    const result = await this.authService.register({
      name,
      email,
      password,
      role,
    });

    return ApiResponse.success(res, result, 'Registration successful', 201, {
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  });

  /**
   * POST /api/auth/login
   * Login user
   */
  login = asyncHandler(async (req: Request<LoginDto>, res: Response) => {
    const { email, password } = req.body;

    const result = await this.authService.login(email, password);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth',
    });

    return ApiResponse.success(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 'Login successful');
  });

  /**
   * POST /api/auth/logout
   * Logout user (invalidate refresh token)
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (userId) {
      await this.authService.logout(userId);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', { path: '/api/auth' });

    return ApiResponse.success(res, null, 'Logged out successfully');
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  refresh = asyncHandler(async (req: Request<RefreshTokenDto>, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    return ApiResponse.success(res, tokens, 'Token refreshed');
  });

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const user = await this.authService.getUserById(req.user.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return ApiResponse.success(res, user);
  });

  /**
   * POST /api/auth/forgot-password
   * Request password reset
   */
  forgotPassword = asyncHandler(async (req: Request<{ email: string }>, res: Response) => {
    const { email } = req.body;

    await this.authService.forgotPassword(email);

    // Always return success to prevent email enumeration
    return ApiResponse.success(res, null, 'If email exists, reset instructions sent');
  });

  /**
   * POST /api/auth/reset-password
   * Reset password using token
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    await this.authService.resetPassword(token, password);

    return ApiResponse.success(res, null, 'Password reset successful');
  });

  /**
   * POST /api/auth/verify-email
   * Verify email address
   */
  verifyEmail = asyncHandler(async (req: Request<{ token: string }>, res: Response) => {
    const { token } = req.body;

    await this.authService.verifyEmail(token);

    return ApiResponse.success(res, null, 'Email verified successfully');
  });

  /**
   * PATCH /api/auth/profile
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { name, bio, avatar } = req.body;

    const user = await this.authService.updateProfile(req.user.userId, {
      name,
      bio,
      avatar,
    });

    return ApiResponse.success(res, user, 'Profile updated');
  });

  /**
   * PATCH /api/auth/change-password
   * Change user password
   */
  changePassword = asyncHandler(async (req: Request<{ currentPassword: string; newPassword: string; confirmPassword: string }>, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    await this.authService.changePassword(req.user.userId, currentPassword, newPassword);

    return ApiResponse.success(res, null, 'Password changed successfully');
  });
}

export const authController = new AuthController();
