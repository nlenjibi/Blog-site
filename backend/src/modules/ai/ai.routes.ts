import { Router } from 'express';
import { AIController } from './ai.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/logger.middleware';

const router = Router();
const aiController = new AIController();

/**
 * @route POST /api/ai/summarize
 * @desc Generate AI summary
 * @access Private (authenticated)
 */
router.post('/summarize', authenticate, asyncHandler(aiController.summarizePost));

/**
 * @route POST /api/ai/chat
 * @desc Chat with article assistant
 * @access Private (authenticated)
 */
router.post('/chat', authenticate, asyncHandler(aiController.chatAboutArticle));

/**
 * @route POST /api/ai/suggest-tags
 * @desc Suggest tags
 * @access Private (authenticated)
 */
router.post('/suggest-tags', authenticate, asyncHandler(aiController.suggestTags));

/**
 * @route POST /api/ai/seo-suggestions/:id
 * @desc Get SEO suggestions
 * @access Private (authenticated)
 */
router.post('/seo-suggestions/:id', authenticate, asyncHandler(aiController.getSEOSuggestions));

/**
 * @route POST /api/ai/recommend
 * @desc Get personalized recommendations
 * @access Private (authenticated)
 */
router.post('/recommend', authenticate, asyncHandler(aiController.getRecommendations));

export default router;
