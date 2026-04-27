import { AuthService } from '../auth.service';
import { User } from '../../models/User.model';
import bcrypt from 'bcryptjs';
import { AppError } from '../../utils/error.util';

// Mock dependencies
jest.mock('../../models/User.model');
jest.mock('bcryptjs');
jest.mock('../../utils/email.util');
jest.mock('../../utils/cache.util');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create fresh instance
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        password: 'hashedpassword',
        isActive: true,
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await authService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('john@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      (User.findOne as jest.Mock).mockResolvedValue({ email: 'john@example.com' });

      // Act & Assert
      await expect(
        authService.register({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow('Email already registered');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
    });

    it('should throw error with invalid role', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.register({
          name: 'John',
          email: 'john@example.com',
          password: 'Password123!',
          role: 'hacker' as any,
        })
      ).rejects.toThrow('Invalid role assignment');
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        name: 'John Doe',
        role: 'user',
        isActive: true,
        password: 'hashedpassword',
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          email: 'john@example.com',
          name: 'John Doe',
          role: 'user',
        }),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await authService.login('john@example.com', 'Password123!');

      // Assert
      expect(result).toBeDefined();
      expect(result.user.email).toBe('john@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login('nonexistent@example.com', 'password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for wrong password', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        password: 'hashedpassword',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login('john@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive account', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        password: 'hashedpassword',
        isActive: false,
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        authService.login('john@example.com', 'Password123!')
      ).rejects.toThrow('Account is deactivated');
    });
  });

  describe('logout', () => {
    it('should invalidate refresh token', async () => {
      const userId = 'user123';

      // Spy on cacheService.del
      const delSpy = jest.spyOn(require('../../utils/cache.util'), 'cacheService').mockImplementation({
        del: jest.fn(),
      } as any);

      await authService.logout(userId);

      expect(delSpy.del).toHaveBeenCalledWith(`refreshToken:${userId}`);
    });
  });

  describe('getUserById', () => {
    it('should return user without password', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          name: 'John',
          email: 'john@example.com',
        }),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.getUserById('user123');

      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
    });

    it('should return null if user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      const result = await authService.getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should change password when current password is correct', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        password: 'hashedpassword',
        save: jest.fn().mockResolvedValue({}),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newhashedpassword');

      await authService.changePassword(userId, 'currentPass', 'newPass');

      expect(bcrypt.compare).toHaveBeenCalledWith('currentPass', 'hashedpassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPass', 12);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error for incorrect current password', async () => {
      const mockUser = {
        _id: 'user123',
        password: 'hashedpassword',
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.changePassword('user123', 'wrongpass', 'newPass')
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});
