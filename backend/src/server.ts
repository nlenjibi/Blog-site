import http from 'http';
import app from './app';
import { connectDB } from './config/database';
import { logger } from './utils/logger.util';

const PORT = process.env.PORT || 8000;

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

/**
 * Start server
 */
server.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info(`📍 Listening on port ${PORT}`);
  logger.info(`📝 API available at http://localhost:${PORT}/api`);
  logger.info(`❤️  Health check at http://localhost:${PORT}/health`);
});

/**
 * Graceful shutdown
 */
const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Closing server...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    // Close database connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    // Close Redis if exists
    // await redis.quit();

    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  shutdown('unhandledRejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});
