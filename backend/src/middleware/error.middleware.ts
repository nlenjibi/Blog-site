import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/error.util';
import { logger } from '@/utils/logger.util';

/**
 * Global error handler middleware
 * Must be the last middleware registered
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error with request context
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...(req.user && { userId: req.user.userId }),
  });

  // Handle known application errors
  if (err instanceof AppError) {
    const response = {
      success: false,
      message: err.message,
      statusCode: err.statusCode,
    };

    // Include validation errors if present
    if (err.errors && err.errors.length > 0) {
      response.errors = err.errors;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values((err as any).errors).map((e: any) => ({
      path: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors,
      statusCode: 400,
    });
  }

  // Handle Mongoose duplicate key errors
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      statusCode: 409,
    });
  }

  // Handle Mongoose cast errors (invalid ID format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${(err as any).path}: ${(err as any).value}`,
      statusCode: 400,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      statusCode: 401,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      statusCode: 401,
    });
  }

  // Default 500 error
  logger.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    statusCode: 500,
  });
};

/**
 * 404 Not Found handler (for routes that don't exist)
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
    statusCode: 404,
  });
};
