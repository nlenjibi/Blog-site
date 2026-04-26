import Redis from 'ioredis';
import { logger } from '@/utils/logger.util';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');
const redisPassword = process.env.REDIS_PASSWORD;

export const redis = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyOnConnect: true,
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('❌ Redis connection error:', err);
});

redis.on('ready', () => {
  logger.info('✅ Redis ready');
});

redis.on('close', () => {
  logger.warn('⚠️ Redis connection closed');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await redis.quit();
  logger.info('📦 Redis connection closed');
});

export const pingRedis = async (): Promise<boolean> => {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error('Redis ping failed:', error);
    return false;
  }
};
