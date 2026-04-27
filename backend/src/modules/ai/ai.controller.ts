import { Request, Response, NextFunction } from 'express';
import { AIService } from './ai.service';
import { ApiResponse } from '@/utils/response.util';
import { AppError } from '@/utils/error.util';
import { asyncHandler } from '@/middleware/logger.middleware';
import { z } from 'zod';

/**
 * AIController handles AI-powered endpoints
 */
export class AIController {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * POST /api/ai/summarize
   * Generate AI summary for a post
   */
  summarizePost = asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.body;

    if (!postId) {
      throw new AppError('postId is required', 400);
    }

    const { summary, tokensUsed } = await this.aiService.getOrCreateSummary(postId);

    return ApiResponse.success(res, { summary, tokensUsed }, 'Summary generated');
  });

  /**
   * POST /api/ai/chat
   * Chat with article assistant
   */
  chatAboutArticle = asyncHandler(async (req: Request, res: Response) => {
    const { articleContent, message, history = [] } = req.body;

    if (!articleContent || !message) {
      throw new AppError('articleContent and message are required', 400);
    }

    const response = await this.aiService.chatAboutArticle(articleContent, message, history);

    return ApiResponse.success(res, { response }, 'Chat response generated');
  });

  /**
   * POST /api/ai/suggest-tags
   * Suggest tags for article
   */
  suggestTags = asyncHandler(async (req: Request, res: Response) => {
    const { content, title } = req.body;

    if (!content || !title) {
      throw new AppError('content and title are required', 400);
    }

    const tags = await this.aiService.suggestTags(content, title);

    return ApiResponse.success(res, { tags }, 'Tags suggested');
  });

  /**
   * POST /api/ai/seo-suggestions
   * Get SEO analysis and suggestions
   */
  getSEOSuggestions = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    const analysis = await this.aiService.analyzeSEO(id);

    return ApiResponse.success(res, analysis, 'SEO analysis complete');
  });

  /**
   * POST /api/ai/recommend
   * Get recommended posts
   */
  getRecommendations = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new AppError('Authentication required', 401);
    }

    const postIds = await this.aiService.generateRecommendations(req.user.userId);

    return ApiResponse.success(res, { postIds }, 'Recommendations generated');
  });
}

export const aiController = new AIController();
