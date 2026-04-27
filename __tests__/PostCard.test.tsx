import React from 'react';
import { render, screen } from '@testing-library/react';
import { PostCard } from '@/components/posts/PostCard';
import type { Post } from '@/types';

const mockPost: Post = {
  _id: '1',
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'This is a test excerpt',
  content: 'This is the full content',
  coverImage: 'https://example.com/image.jpg',
  featured: false,
  published: true,
  publishedAt: '2024-01-01T00:00:00.000Z',
  author: {
    _id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'USER',
    isVerified: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  category: {
    _id: '1',
    name: 'Technology',
    slug: 'tech',
    description: 'Tech posts',
    color: '#3b82f6',
    icon: '',
    order: 0,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  tags: [
    { _id: '1', name: 'tech', slug: 'tech' },
  ],
  views: 100,
  readingTime: 5,
  seoTitle: 'Test SEO',
  seoDescription: 'Test Description',
  metaKeywords: 'test',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  likesCount: 10,
  commentsCount: 5,
  isLiked: false,
  isBookmarked: false,
};

describe('PostCard', () => {
  it('renders post title', () => {
    render(<PostCard post={mockPost} variant="default" />);
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });

  it('renders post excerpt', () => {
    render(<PostCard post={mockPost} variant="default" showAuthor={false} />);
    expect(screen.getByText('This is a test excerpt')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(<PostCard post={mockPost} variant="default" />);
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('renders author name', () => {
    render(<PostCard post={mockPost} variant="default" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders reading time', () => {
    render(<PostCard post={mockPost} variant="default" />);
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it('renders featured badge when post is featured', () => {
    const featuredPost = { ...mockPost, featured: true };
    render(<PostCard post={featuredPost} variant="default" />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('renders like count', () => {
    render(<PostCard post={mockPost} variant="default" />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders comment count', () => {
    render(<PostCard post={mockPost} variant="default" />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
