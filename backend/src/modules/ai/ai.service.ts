import OpenAI from 'openai';
import { AISummary } from '@/models/AISummary.model';
import { Post } from '@/models/Post.model';
import { PostView } from '@/models/PostView.model';
import { Like } from '@/models/Like.model';
import { Bookmark } from '@/models/Bookmark.model';
import { User } from '@/models/User.model';
import { cacheService } from '@/utils/cache.util';
import { logger } from '@/utils/logger.util';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AIService handles all AI-related functionality
 */
export class AIService {
  private readonly DEFAULT_MODEL = 'gpt-4-turbo-preview';
  private readonly SUMMARY_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  /**
   * Generate AI summary for a blog post
   */
  async generateSummary(postId: string, content: string): Promise<{ summary: string; tokensUsed: number }> {
    // Check for cached summary
    const cached = await AISummary.findOne({ post: postId, expiresAt: { $gt: new Date() } });
    if (cached) {
      return { summary: cached.content, tokensUsed: cached.tokensUsed };
    }

    // Truncate content if too long
    const truncatedContent = content.length > 6000 ? content.substring(0, 6000) + '...' : content;

    try {
      const response = await openai.chat.completions.create({
        model: this.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert content summarizer. Create a concise 3-5 bullet point summary that captures the main ideas. Focus on key facts, insights, and takeaways.',
          },
          {
            role: 'user',
            content: `Summarize this article:\n\n${truncatedContent}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.5,
      });

      const summary = response.choices[0]?.message?.content || 'Summary could not be generated.';
      const tokensUsed = response.usage?.total_tokens || 0;

      // Cache summary
      const expiresAt = new Date(Date.now() + this.SUMMARY_TTL * 1000);
      await AISummary.findOneAndUpdate(
        { post: postId },
        {
          $set: {
            content: summary,
            modelUsed: this.DEFAULT_MODEL,
            tokensUsed,
            expiresAt,
          },
        },
        { upsert: true, new: true }
      );

      return { summary, tokensUsed };
    } catch (error: any) {
      logger.error('OpenAI summary error:', error);
      throw new Error('Failed to generate summary: ' + error.message);
    }
  }

  /**
   * Get or generate summary for post
   */
  async getOrCreateSummary(postId: string): Promise<string> {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Try cache first
    const cachedSummary = await AISummary.findOne({ post: postId });
    if (cachedSummary && cachedSummary.expiresAt > new Date()) {
      return cachedSummary.content;
    }

    // Generate new summary
    const { summary } = await this.generateSummary(postId, post.content);

    return summary;
  }

  /**
   * Chat with article assistant
   */
  async chatAboutArticle(articleContent: string, userMessage: string, chatHistory: Array<{ role: string; content: string }> = []): Promise<string> {
    // Truncate content if too long
    const truncatedContent = articleContent.length > 8000 ? articleContent.substring(0, 8000) + '...' : articleContent;

    try {
      const messages = [
        {
          role: 'system',
          content: `You are a helpful assistant discussing this article. Use the article content to answer questions accurately. If information isn't in the article, say so.\n\nArticle:\n${truncatedContent}`,
        },
        ...chatHistory.slice(-10), // Keep last 10 exchanges for context
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const response = await openai.chat.completions.create({
        model: this.DEFAULT_MODEL,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Unable to generate response.';
    } catch (error: any) {
      logger.error('OpenAI chat error:', error);
      throw new Error('Failed to generate chat response: ' + error.message);
    }
  }

  /**
   * Suggest tags for article content
   */
  async suggestTags(content: string, title: string): Promise<string[]> {
    const truncatedContent = content.length > 4000 ? content.substring(0, 4000) + '...' : content;

    try {
      const response = await openai.chat.completions.create({
        model: this.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Extract 5-8 relevant tags from the article. Return only the tags as a comma-separated list. Focus on topics, technologies, and key themes.',
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nContent: ${truncatedContent}`,
          },
        ],
        max_tokens: 100,
        temperature: 0.3,
      });

      const tagsText = response.choices[0]?.message?.content || '';
      const tags = tagsText
        .split(',')
        .map((tag: string) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8);

      return tags;
    } catch (error: any) {
      logger.error('OpenAI tags error:', error);
      return [];
    }
  }

  /**
   * Generate article recommendations for a user
   */
  async generateRecommendations(userId: string): Promise<string[]> {
    const cacheKey = `ai:recommendations:${userId}`;
    const cached = await cacheService.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get user's reading history
    const userLikes = await Like.find({ user: userId }).populate('post').sort({ createdAt: -1 }).limit(20).lean();
    const userBookmarks = await Bookmark.find({ user: userId }).populate('post').lean();

    const interactedPostIds = [
      ...userLikes.map(l => (l.post as any)._id),
      ...userBookmarks.map(b => (b.post as any)._id),
    ];

    if (interactedPostIds.length === 0) {
      // Return popular posts
      const popular = await Post.find({ published: true, isActive: true })
        .sort({ views: -1 })
        .limit(5)
        .select('_id')
        .lean();
      return popular.map(p => p._id);
    }

    // Get categories and tags from user's interactions
    const userPosts = await Post.find({ _id: { $in: interactedPostIds }, published: true });

    const userCategories = [...new Set(userPosts.map(p => p.category.toString()))];
    const userTags = [...new Set(userPosts.flatMap(p => p.tags.map((t: any) => t.toString() || t)))];

    // Simple content-based filtering
    const recommendations = await Post.find({
      _id: { $nin: interactedPostIds },
      published: true,
      isActive: true,
      $or: [
        { category: { $in: userCategories } },
        { tags: { $in: userTags } },
      ],
    })
      .sort({ views: -1 })
      .limit(10)
      .select('_id')
      .lean();

    const recommendedIds = recommendations.map(r => r._id);

    // Cache for 24 hours
    await cacheService.set(cacheKey, recommendedIds, 24 * 60 * 60);

    return recommendedIds;
  }

  /**
   * Analyze SEO and provide suggestions
   */
  async analyzeSEO(postId: string): Promise<{
    score: number;
    suggestions: string[];
    keywordDensity: Record<string, number>;
    readability: string;
  }> {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const suggestions: string[] = [];
    let score = 100;

    // Title analysis
    if (!post.seoTitle || post.seoTitle.length < 30) {
      suggestions.push('SEO title is too short (aim for 50-60 characters)');
      score -= 10;
    }
    if (post.seoTitle && post.seoTitle.length > 60) {
      suggestions.push('SEO title is too long (>60 chars)');
      score -= 10;
    }

    // Meta description
    if (!post.seoDescription || post.seoDescription.length < 120) {
      suggestions.push('Meta description is too short (aim for 150-160 characters)');
      score -= 10;
    }

    // Content length
    const wordCount = post.content.split(/\s+/).length;
    if (wordCount < 300) {
      suggestions.push('Content is too short (< 300 words)');
      score -= 10;
    } else if (wordCount > 5000) {
      suggestions.push('Content is very long (> 5000 words), consider breaking into sections');
      score -= 5;
    }

    // Reading time
    if (post.readingTime < 2) {
      suggestions.push('Very short article (under 2 min read)');
      score -= 5;
    }

    // Cover image
    if (!post.coverImage) {
      suggestions.push('Add a cover image for better engagement');
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      suggestions,
      keywordDensity: this.calculateKeywordDensity(post.content),
      readability: wordCount > 1000 ? 'Long-form' : 'Standard',
    };
  }

  /**
   * Calculate keyword density
   */
  private calculateKeywordDensity(content: string): Record<string, number> {
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = words.length;
    const frequencies: Record<string, number> = {};

    words.forEach((word) => {
      // Remove punctuation
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3) { // Ignore short words
        frequencies[cleanWord] = (frequencies[cleanWord] || 0) + 1;
      }
    });

    const density: Record<string, number> = {};
    Object.entries(frequencies)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10) // Top 10 keywords
      .forEach(([key, count]) => {
        density[key] = parseFloat(((count / wordCount) * 100).toFixed(2));
      });

    return density;
  }
}

export const aiService = new AIService();
