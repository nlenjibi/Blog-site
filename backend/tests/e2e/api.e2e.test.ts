import request from 'supertest';
import { app } from '../../src/app';
import mongoose from 'mongoose';
import { User } from '../../src/models/User.model';
import { Post } from '../../src/models/Post.model';
import { Category } from '../../src/models/Category.model';
import { Comment } from '../../src/models/Comment.model';
import bcrypt from 'bcryptjs';

// Test database setup
const TEST_DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartinsight_e2e';

describe('E2E API Tests - Critical User Journeys', () => {
  let authToken: string;
  let testPostId: string;
  let testCategory: any;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(TEST_DB);
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create test category
    testCategory = await Category.create({
      name: 'Technology',
      slug: 'technology',
      color: '#3B82F6',
    });
  });

  describe('User Registration → Login → Create Post → Comment Flow', () => {
    it('should complete the full user journey', async () => {
      // Step 1: Register
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        })
        .expect(201);

      expect(registerRes.body.success).toBe(true);
      authToken = registerRes.body.data.accessToken;

      const authHeader = { Authorization: `Bearer ${authToken}` };

      // Step 2: Get profile
      const profileRes = await request(app)
        .get('/api/users/profile')
        .set(authHeader)
        .expect(200);

      expect(profileRes.body.data.name).toBe('John Doe');

      // Step 3: Create post
      const createPostRes = await request(app)
        .post('/api/posts')
        .set(authHeader)
        .send({
          title: 'My First Blog Post',
          content: 'This is the content of my first blog post. It is an interesting topic about IoT and smart devices.',
          categoryId: testCategory._id,
          tags: ['IoT', 'Smart Home'],
          published: true,
        })
        .expect(201);

      expect(createPostRes.body.success).toBe(true);
      const postSlug = createPostRes.body.data.slug;
      testPostId = createPostRes.body.data._id;

      // Step 4: View the post
      const viewRes = await request(app)
        .get(`/api/posts/${postSlug}`)
        .expect(200);

      expect(viewRes.body.success).toBe(true);
      expect(viewRes.body.data.title).toBe('My First Blog Post');

      // Step 5: Comment on the post
      const commentRes = await request(app)
        .post('/api/comments')
        .set(authHeader)
        .send({
          content: 'Great article! Really helpful.',
          postId: testPostId,
        })
        .expect(201);

      expect(commentRes.body.success).toBe(true);
      const commentId = commentRes.body.data._id;

      // Step 6: Get comments
      const getCommentsRes = await request(app)
        .get(`/api/comments/post/${testPostId}`)
        .expect(200);

      expect(getCommentsRes.body.data).toHaveLength(1);
      expect(getCommentsRes.body.data[0].content).toBe('Great article! Really helpful.');

      // Step 7: Update comment
      await request(app)
        .patch(`/api/comments/${commentId}`)
        .set(authHeader)
        .send({ content: 'Great article! Really helpful. (edited)' })
        .expect(200);

      // Step 8: Like the post
      const likeRes = await request(app)
        .post(`/api/posts/${testPostId}/like`)
        .set(authHeader)
        .expect(200);

      expect(likeRes.body.success).toBe(true);

      // Step 9: Bookmark the post
      const bookmarkRes = await request(app)
        .post(`/api/posts/${testPostId}/bookmark`)
        .set(authHeader)
        .expect(200);

      expect(bookmarkRes.body.success).toBe(true);

      // Step 10: Logout
      await request(app)
        .post('/api/auth/logout')
        .set(authHeader)
        .expect(200);
    });
  });

  describe('Admin User Management', () => {
    it('should allow admin to manage users', async () => {
      // Create admin user
      const hashedPassword = await bcrypt.hash('AdminPass123!', 12);
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
      });

      // Login as admin
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'AdminPass123!',
        })
        .expect(200);

      const adminToken = loginRes.body.data.accessToken;
      const adminAuth = { Authorization: `Bearer ${adminToken}` };

      // Get all users
      const usersRes = await request(app)
        .get('/api/admin/users')
        .set(adminAuth)
        .expect(200);

      expect(usersRes.body.data).toBeDefined();
      expect(Array.isArray(usersRes.body.data)).toBe(true);

      // Get stats
      await request(app)
        .get('/api/admin/users/stats')
        .set(adminAuth)
        .expect(200);

      // Get dashboard
      await request(app)
        .get('/api/admin/dashboard')
        .set(adminAuth)
        .expect(200);
    });
  });

  describe('Content Moderation', () => {
    it('should allow editor to approve comments', async () => {
      // Create editor user
      const hashedPassword = await bcrypt.hash('EditorPass123!', 12);
      const editorUser = await User.create({
        name: 'Editor User',
        email: 'editor@example.com',
        password: hashedPassword,
        role: 'editor',
      });

      // Create post (published)
      const post = await Post.create({
        title: 'Test Post',
        slug: 'test-post-' + Date.now(),
        content: 'Test content',
        author: editorUser._id,
        category: testCategory._id,
        published: true,
      });

      // Login as editor
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'editor@example.com',
          password: 'EditorPass123!',
        })
        .expect(200);

      const editorToken = loginRes.body.data.accessToken;
      const editorAuth = { Authorization: `Bearer ${editorToken}` };

      // Create comment (should be auto-approved since author)
      const commentRes = await request(app)
        .post('/api/comments')
        .set(editorAuth)
        .send({
          content: 'Editor comment',
          postId: post._id,
        })
        .expect(201);

      const commentId = commentRes.body.data._id;

      // Get pending comments (should be empty for editor comments)
      await request(app)
        .get('/api/admin/comments/pending')
        .set(editorAuth)
        .expect(200);
    });
  });

  describe('AI Features', () => {
    it('should generate summary and chat response', async () => {
      // Note: This test requires OPENAI_API_KEY to be set
      // In production-like tests, you would mock OpenAI API

      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping AI tests: OPENAI_API_KEY not set');
        return;
      }

      // User creation
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'AI Tester',
          email: 'aitest@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        })
        .expect(201);

      const token = registerRes.body.data.accessToken;
      const authHeader = { Authorization: `Bearer ${token}` };

      // Create post with content
      const postRes = await request(app)
        .post('/api/posts')
        .set(authHeader)
        .send({
          title: 'AI Test Post',
          content: 'This is a test article about artificial intelligence and its applications in modern technology. AI is transforming industries.',
          categoryId: testCategory._id,
          tags: ['AI'],
          published: true,
        })
        .expect(201);

      const postId = postRes.body.data._id;

      // Request summary
      const summaryRes = await request(app)
        .post('/api/ai/summarize')
        .set(authHeader)
        .send({ postId })
        .expect(200);

      expect(summaryRes.body.data.summary).toBeDefined();
      expect(summaryRes.body.data.tokensUsed).toBeGreaterThan(0);

      // Chat about article
      const chatRes = await request(app)
        .post('/api/ai/chat')
        .set(authHeader)
        .send({
          articleContent: postRes.body.data.content,
          message: 'What is the main topic?',
          history: [],
        })
        .expect(200);

      expect(chatRes.body.data.response).toBeDefined();
    });
  });
});
