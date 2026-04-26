import { Request } from 'express';

/**
 * Extended Express Request with user information
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * User roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  USER = 'user',
}

/**
 * Post publication status
 */
export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * Pagination query parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ path: string; message: string }>;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * User profile for public view (excludes sensitive data)
 */
export interface UserPublic {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  createdAt: string;
  postsCount?: number;
}

/**
 * User for JWT token payload
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}
