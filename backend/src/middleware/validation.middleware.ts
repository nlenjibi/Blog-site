import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from '@/utils/error.util';

/**
 * Validation middleware using Zod schemas
 */
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate body, query, and params based on HTTP method
      const validateData: Record<string, any> = {};

      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        validateData.body = req.body;
      }

      if (['GET', 'DELETE', 'PATCH'].includes(req.method)) {
        validateData.query = req.query;
        validateData.params = req.params;
      }

      await schema.parseAsync(validateData);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        return next(
          new AppError('Validation failed', 400, errors)
        );
      }

      next(error);
    }
  };
};

/**
 * Middleware to sanitize request object (remove __proto__, constructor, etc.)
 * Used before passing data to database
 */
export const sanitizeBody = (allowedFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const sanitized: Record<string, any> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        sanitized[field] = req.body[field];
      }
    }

    req.body = sanitized;
    next();
  };
};
