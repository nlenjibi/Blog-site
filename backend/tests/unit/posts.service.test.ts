import { PostsService } from './posts.service';
import { Post, IPost } from '../../models/Post.model';
import { Category } from '../../models/Category.model';
import { Tag } from '../../models/Tag.model';
import { Comment } from '../../models/Comment.model';
import { AppError } from '../../utils/error.util';
import { cacheService } from '../../utils/cache.util';

// Mock models
jest.mock('../../models/Post.model');
jest.mock('../../models/Category.model');
jest.mock('../../models/Tag.model');
jest.mock('../../utils/cache.util');
jest.mock('slugify');

const mockPost = {
  _id: 'post123',
  title: 'Test Post',
  slug: 'test-post',
  content: 'This is test content',
  excerpt: 'Test excerpt',
  published: false,
  author: 'user123',
  category: 'cat123',
  tags: ['tag1', 'tag2'],
  views: 0,
  readingTime: 1,
  create: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  updateMany: jest.fn(),
};

describe('PostsService', () => {
  let postsService: PostsService;

  beforeEach(() => {
    jest.clearAllMocks();
    postsService = new PostsService();
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      // Arrange
      (Category.findById as jest.Mock).mockResolvedValue({ _id: 'cat123' });
      (Tag.findOne as jest.Mock).mockResolvedValue(null);
      (Tag.create as jest.Mock).mockResolvedValue({ _id: 'tag1', name: 'test' });
      (Post.findOne as jest.Mock).mockResolvedValue(null);
      (Post.create as jest.Mock).mockResolvedValue({
        ...mockPost,
        _id: 'post123',
        author: 'user123',
        category: 'cat123',
        tags: ['tag1'],
      });
      (Tag.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
      (cacheService.delPattern as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await postsService.createPost({
        title: 'Test Post',
        content: 'This is test content',
        categoryId: 'cat123',
        tags: ['test'],
        authorId: 'user123',
      });

      // Assert
      expect(Post.create).toHaveBeenCalled();
      expect(Tag.updateMany).toHaveBeenCalled();
      expect(result.title).toBe('Test Post');
    });

    it('should throw error if title already exists', async () => {
      (Post.findOne as jest.Mock).mockResolvedValue({ title: 'Existing Post' });

      await expect(
        postsService.createPost({
          title: 'Test Post',
          content: 'Content',
          categoryId: 'cat123',
          authorId: 'user123',
        })
      ).rejects.toThrow('A post with this title already exists');
    });

    it('should throw error if category not found', async () => {
      (Post.findOne as jest.Mock).mockResolvedValue(null);
      (Category.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        postsService.createPost({
          title: 'Test Post',
          content: 'Content',
          categoryId: 'invalid',
          authorId: 'user123',
        })
      ).rejects.toThrow('Category not found');
    });
  });

  describe('getPostBySlug', () => {
    it('should return post by slug if published', async () => {
      const mockPostData = {
        _id: 'post123',
        slug: 'test-post',
        title: 'Test Post',
        content: 'Content',
        published: true,
        author: { _id: 'user123', name: 'John' },
        category: { _id: 'cat123', name: 'Tech' },
        tags: [],
        toObject: () => mockPostData,
      };

      (Post.findOne as jest.Mock).mockResolvedValue(mockPostData);

      const result = await postsService.getPostBySlug('test-post');

      expect(Post.findOne).toHaveBeenCalledWith({ slug: 'test-post', published: true });
      expect(result).toBeDefined();
    });

    it('should throw error if post not found', async () => {
      (Post.findOne as jest.Mock).mockResolvedValue(null);

      await expect(postsService.getPostBySlug('nonexistent')).rejects.toThrow('Post not found');
    });
  });

  describe('calculateReadingTime', () => {
    it('should calculate reading time correctly', async () => {
      // Access private method for testing via any cast
      const service = postsService as any;
      const content = 'word '.repeat(200); // 200 words
      const readingTime = service.calculateReadingTime(content);

      expect(readingTime).toBe(1); // 200 words / 200 wpm = 1 min
    });

    it('should return at least 1 minute for short content', async () => {
      const service = postsService as any;
      const readingTime = service.calculateReadingTime('short');

      expect(readingTime).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getPopularPosts', () => {
    it('should return popular posts from cache', async () => {
      const cachedPosts = [{ _id: 'post1' }, { _id: 'post2' }];
      (cacheService.get as jest.Mock).mockResolvedValue(cachedPosts);

      const result = await postsService.getPopularPosts(5, 'week');

      expect(cacheService.get).toHaveBeenCalledWith('posts:popular:week');
      expect(result).toEqual(cachedPosts);
    });

    it('should fetch from database if not cached', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (Post.find as jest.Mock).mockResolvedValue([mockPost]);
      (cacheService.set as jest.Mock).mockResolvedValue(undefined);

      const result = await postsService.getPopularPosts(5);

      expect(result).toHaveLength(1);
      expect(cacheService.set).toHaveBeenCalled();
    });
  });
});
