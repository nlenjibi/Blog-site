/**
 * Custom error class for application errors
 * Extends native Error with status code and additional metadata
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: any[];

  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Set to false for programming errors
    this.errors = errors;

    // Capture stack trace (excluding this constructor)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Runtime error for unexpected errors (non-operational)
 */
export class InternalServerError extends Error {
  public statusCode = 500;
  public isOperational = false;

  constructor(message: string = 'Internal server error') {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error helper
 */
export const createValidationError = (errors: Array<{ path: string; message: string }>) => {
  const appError = new AppError('Validation failed', 400, errors);
  return appError;
};

/**
 * Conflict error (e.g., duplicate key)
 */
export const createConflictError = (field: string, value: string) => {
  return new AppError(`${field} already exists with value: ${value}`, 409);
};

/**
 * Not found error
 */
export const createNotFoundError = (resource: string) => {
  return new AppError(`${resource} not found`, 404);
};

/**
 * Unauthorized error
 */
export const createUnauthorizedError = (message: string = 'Unauthorized') => {
  return new AppError(message, 401);
};

/**
 * Forbidden error
 */
export const createForbiddenError = (message: string = 'Forbidden') => {
  return new AppError(message, 403);
};
