import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(2000),
    postId: z.string().min(1),
    parentId: z.string().optional().nullable(),
  }),
});

export const updateCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(2000),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const getCommentsSchema = z.object({
  params: z.object({
    postId: z.string().min(1),
  }),
  query: z.object({
    page: z.string().transform((v) => parseInt(v) || 1).pipe(z.number().positive()).optional(),
    limit: z.string().transform((v) => parseInt(v) || 20).pipe(z.number().positive()).optional(),
  }),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>['body'];
