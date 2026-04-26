import { Response } from 'express';
import { AppError } from './error.util';

/**
 * Standardized API response helper
 */
export class ApiResponse {
  /**
   * Success response
   */
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
    meta?: Record<string, any>
  ): void {
    const response: Record<string, any> = {
      success: true,
      message,
      data,
    };

    if (meta) {
      response.meta = meta;
    }

    res.status(statusCode).json(response);
  }

  /**
   * Error response
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    errors?: any[],
    debug?: any
  ): void {
    const response: Record<string, any> = {
      success: false,
      message,
      statusCode,
    };

    if (errors && errors.length > 0) {
      response.errors = errors;
    }

    // Include debug info in development
    if (debug && process.env.NODE_ENV === 'development') {
      response.debug = debug;
    }

    res.status(statusCode).json(response);
  }

  /**
   * Created response (201)
   */
  static created<T>(res: Response, data: T, message: string = 'Created'): void {
    this.success(res, data, message, 201);
  }

  /**
   * No content response (204)
   */
  static noContent(res: Response): void {
    res.status(204).json({ success: true });
  }

  /**
   * Paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Success'
  ): void {
    const totalPages = Math.ceil(total / limit);

    this.success(res, data, message, 200, {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  }
}

/**
 * Handle caught errors and forward to error middleware
 */
export const handleError = (res: Response, error: Error | AppError): void => {
  if (error instanceof AppError) {
    return ApiResponse.error(res, error.message, error.statusCode, error.errors);
  }

  return ApiResponse.error(res, error.message, 500);
};
