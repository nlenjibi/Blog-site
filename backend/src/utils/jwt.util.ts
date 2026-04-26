import jwt from 'jsonwebtoken';
import { AppError } from './error.util';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined in environment variables');
}

/**
 * Generate JWT access token
 */
export const generateToken = (payload: object, expiresIn: string = '1h'): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: object): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401);
    }
    throw new AppError('Token verification failed', 401);
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as any;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid refresh token', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Refresh token expired', 401);
    }
    throw new AppError('Refresh token verification failed', 401);
  }
};

/**
 * Decode token without verification (for extracting payload)
 * Use with caution - does not validate signature
 */
export const decodeToken = (token: string): any => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * Token payload types
 */
export interface TokenPayload {
  userId: string;
  email?: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
}
