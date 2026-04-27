// Base types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
}

// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'USER' | 'AUTHOR' | 'EDITOR' | 'ADMIN';
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  postsCount?: number;
}

// Category types
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tag types
export interface Tag {
  _id: string;
  name: string;
  slug: string;
}

// Post types
export interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  featured: boolean;
  published: boolean;
  publishedAt?: string;
  author: User;
  category: Category;
  tags: Tag[];
  views: number;
  readingTime: number;
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

// Comment types
export interface Comment {
  _id: string;
  content: string;
  author: User;
  post: string;
  parent?: Comment;
  replies?: Comment[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Like types
export interface Like {
  _id: string;
  post: string;
  user: string;
  createdAt: string;
}

// Bookmark types
export interface Bookmark {
  _id: string;
  post: Post;
  user: string;
  createdAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// API Filters
export interface PostsFilter {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  author?: string;
  featured?: boolean;
  published?: boolean;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// Theme types
export type Theme = 'light' | 'dark' | 'black';

// API Endpoints
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    profile: '/auth/profile',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    changePassword: '/auth/change-password',
  },
  // Posts
  posts: {
    list: '/posts',
    featured: '/posts/featured/list',
    byId: (id: string) => `/posts/id/${id}`,
    bySlug: (slug: string) => `/posts/${slug}`,
    create: '/posts',
    update: (id: string) => `/posts/${id}`,
    delete: (id: string) => `/posts/${id}`,
    comments: (id: string) => `/posts/${id}/comments`,
    related: (id: string) => `/posts/${id}/related`,
  },
  // Categories
  categories: {
    list: '/categories',
  },
  // Tags
  tags: {
    list: '/tags',
  },
  // Comments
  comments: {
    create: '/comments',
    update: (id: string) => `/comments/${id}`,
    delete: (id: string) => `/comments/${id}`,
  },
  // Interactions
  interactions: {
    like: (postId: string) => `/posts/${postId}/like`,
    bookmark: (postId: string) => `/posts/${postId}/bookmark`,
  },
  // AI
  ai: {
    summarize: '/ai/summarize',
    recommend: '/ai/recommend',
    chat: '/ai/chat',
    suggestTags: '/ai/suggest-tags',
    seoSuggestions: '/ai/seo-suggestions',
  },
  // Admin
  admin: {
    users: '/admin/users',
    userRole: (id: string) => `/admin/users/${id}/role`,
    analytics: '/admin/analytics',
    pendingComments: '/admin/comments/pending',
  },
} as const;
