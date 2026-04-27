/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose from 'mongoose';

// Extend Jest expect matchers if needed

// Global test setup
beforeAll(async () => {
  // Connection is handled by each test suite
});

afterAll(async () => {
  // Cleanup handled by test suite
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-32chars';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartinsight_test';
