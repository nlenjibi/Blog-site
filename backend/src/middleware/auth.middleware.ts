import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt.util';
import { AppError } from '@/utils/error.util';
import { User, IUser } from '@/models/User.model';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Invalid token format', 401);
    }

    const decoded = verifyToken(token);

    // Verify user still exists in database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    // Attach user info to request
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
};

/**
 * Authorization middleware - checks if user has required role(s)
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized: No user attached to request', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Requires one of [${roles.join(', ')}] roles`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Optional authentication - doesn't require token but attaches user if present
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');

      if (user) {
        req.user = {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        };
      }
    }
  } catch (error) {
    // Silently ignore errors for optional auth
  }

  next();
};
