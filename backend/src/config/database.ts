import mongoose from 'mongoose';
import { logger } from '@/utils/logger.util';

export const connectDB = async (): Promise<void => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartinsight_db';

    await mongoose.connect(mongoURI);

    logger.info('✅ MongoDB connected successfully');

    // Connection event listeners
    mongoose.connection.on('error', (error) => {
      logger.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('📦 MongoDB connection closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// Define connection state type
export type DBConnection = typeof mongoose.connection;
