import { z } from 'zod';

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    content: z.string().min(100),
    excerpt: z.string().max(500).optional(),
    coverImage: z.string().url().optional(),
    categoryId: z.string().min(1),
    tags: z.array(z.string().min(1)).optional().default([]),
    published: z.boolean().default(false),
    featured: z.boolean().default(false),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    metaKeywords: z.string().max(255).optional(),
  }),
});

export const updatePostSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    content: z.string().min(100).optional(),
    excerpt: z.string().max(500).optional().nullable(),
    coverImage: z.string().url().optional().nullable(),
    categoryId: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).optional(),
    published: z.boolean().optional(),
    featured: z.boolean().optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    metaKeywords: z.string().max(255).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const getPostsSchema = z.object({
  query: z.object({
    page: z.string().transform((val) => parseInt(val) || 1).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform((val) => parseInt(val) || 10).pipe(z.number().int().positive()).optional(),
    category: z.string().optional(),
    tag: z.string().optional(),
    author: z.string().optional(),
    featured: z.boolean().optional(),
    published: z.boolean().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'publishedAt', 'title', 'views']).default('publishedAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const getPostBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});

export type CreatePostDto = z.infer<typeof createPostSchema>['body'];
export type UpdatePostDto = z.infer<typeof updatePostSchema>['body'];
export type GetPostsQuery = z.infer<typeof getPostsSchema>['query'];
