import { Request, Response, NextFunction } from 'express';
import { AppError, errorCodes } from '../utils/error.util';

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', errorCodes.UNAUTHORIZED);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', errorCodes.FORBIDDEN);
    }

    next();
  };
};

export const isOwnerOrAdmin = (resourceOwnerField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', errorCodes.UNAUTHORIZED);
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = (req[resourceOwnerField] as string) === req.user.id;

    if (!isAdmin && !isOwner) {
      throw new AppError('Insufficient permissions', errorCodes.FORBIDDEN);
    }

    next();
  };
};

export default authorize;
