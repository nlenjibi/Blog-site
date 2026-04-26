import { z } from 'zod';
import { RegisterDto } from './auth.validation';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    bio: z.string().max(500).optional(),
    avatar: z.string().url().optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

// Admin-only schemas
export const createUserSchema = z.object({
  body: z.object({
    ...RegisterDto.shape,
    role: z.enum(['admin', 'editor', 'author', 'user']),
  }),
});

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['admin', 'editor', 'author', 'user']),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>['body'];
export type CreateUserDto = z.infer<typeof createUserSchema>['body'];
