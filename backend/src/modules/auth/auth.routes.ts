import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, optionalAuth } from '@/middleware/auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.validation';
import { asyncHandler } from '@/middleware/logger.middleware';

const router = Router();
const authController = new AuthController();

/**
 * @route POST /api/auth/register
 * @desc Register new user
 * @access Public
 */
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(authController.register)
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', validate(loginSchema), asyncHandler(authController.login));

/**
 * @route POST /api/auth/logout
 * @desc Logout user (invalidate refresh token)
 * @access Private
 */
router.post('/logout', authenticate, asyncHandler(authController.logout));

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public (requires valid refresh token in body)
 */
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refresh));

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticate, asyncHandler(authController.me));

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password using token
 * @access Public
 */
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(authController.resetPassword));

/**
 * @route POST /api/auth/verify-email
 * @desc Verify email address
 * @access Public
 */
router.post('/verify-email', validate(verifyEmailSchema), asyncHandler(authController.verifyEmail));

/**
 * @route PATCH /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.patch('/profile', authenticate, asyncHandler(authController.updateProfile));

/**
 * @route PATCH /api/auth/change-password
 * @desc Change password
 * @access Private
 */
router.patch('/change-password', authenticate, asyncHandler(authController.changePassword));

export default router;
