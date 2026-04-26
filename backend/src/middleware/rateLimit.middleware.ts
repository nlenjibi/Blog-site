import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@/config/redis';
import { logger } from '@/utils/logger.util';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
});

/**
 * Authentication endpoints rate limiter
 * 5 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    statusCode: 429,
  },
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * AI endpoints rate limiter (expensive)
 * 20 requests per 15 minutes per user
 */
export const aiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:ai:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'AI rate limit exceeded, please try again later',
    statusCode: 429,
  },
  skipSuccessfulRequests: true,
});

/**
 * Get client IP from request (handles proxies)
 */
export const getClientIp = (req: any): string => {
  return (
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown'
  )?.toString()
    .split(',')[0]
    .trim() || 'unknown';
};
