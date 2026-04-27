import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import { errorHandler, notFoundHandler } from '@/middleware/error.middleware';
import { logger, requestLogger } from '@/middleware/logger.middleware';
import { connectDB } from '@/config/database';

// Import API routes
import authRoutes from '@/modules/auth/auth.routes';
import usersRoutes from '@/modules/users/users.routes';
import postsRoutes from '@/modules/posts/posts.routes';
import commentsRoutes from '@/modules/comments/comments.routes';
import aiRoutes from '@/modules/ai/ai.routes';
import adminRoutes from '@/modules/admin/admin.routes';

export const app: Application = express();

/**
 * Connect to database
 */
connectDB();

/**
 * Essential middleware
 */
// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  exposedHeaders: ['X-Total-Count', 'X-Current-Page', 'X-Total-Pages'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Security middleware
app.use(mongoSanitize());
app.use(xss());

// Request logging
app.use(requestLogger);

/**
 * Rate limiting (after logger)
 */
import { apiLimiter, authLimiter, aiLimiter } from '@/middleware/rateLimit.middleware';

// Apply different rate limiters
app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/', apiLimiter);

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * 404 handler
 */
app.use(notFoundHandler);

/**
 * Error handler (must be last)
 */
app.use(errorHandler);

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);

  // Close server (would need server instance)
  // server.close(() => { ... });

  // Close DB connections
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
