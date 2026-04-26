# SmartInsight AI Blog - Developer Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Database](#database)
6. [API Development](#api-development)
7. [Authentication](#authentication)
8. [AI Integration](#ai-integration)
9. [Theme System](#theme-system)
10. [Performance Optimization](#performance-optimization)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

SmartInsight AI Blog is built as a **full-stack Next.js application** using the App Router. This architecture provides:

- **Server-Side Rendering (SSR)** for SEO & initial load performance
- **API Routes** for backend logic (no separate Express server)
- **Edge Functions** for low-latency AI & search endpoints
- **Static Generation (SSG)** for blog posts where applicable
- **Incremental Static Regeneration (ISR)** for content updates

```
┌─────────────────────────────────────────────┐
│              Client Browser                  │
└─────────────────┬───────────────────────────┘
                  │ HTTPS Requests
┌─────────────────▼───────────────────────────┐
│            Vercel Edge Network              │
├─────────────────────────────────────────────┤
│  ┌────────────┐  ┌───────────────────────┐  │
│  │ static     │  │ Serverless Functions  │  │
│  │ assets     │  │ (API routes)          │  │
│  └────────────┘  └───────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           PostgreSQL Database               │
│          (Prisma ORM Layer)                 │
└─────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│   External Services                         │
│   - OpenAI API                              │
│   - Cloud Storage (S3)                      │
│   - Redis Cache (optional)                  │
└─────────────────────────────────────────────┘
```

**Why Next.js App Router?**
- Modern React patterns (Server Components by default)
- Built-in routing, image optimization, font optimization
- Simplified deployment (single project)
- Reduced latency with Edge Runtime

---

## Tech Stack

### Frontend
| Tool | Purpose | Version |
|------|---------|---------|
| Next.js | React framework (App Router) | 15+ |
| React | UI library | 18+ |
| TypeScript | Type safety | 5+ |
| Tailwind CSS | Utility-first CSS | 3.4+ |
| Framer Motion | Animations | 11+ |
| Lucide React | Icon set | 0.453+ |
| React Markdown | Markdown rendering | 9+ |
| React Syntax Highlighter | Code blocks | 15+ |
| Date-fns | Date formatting | 4+ |
| Zustand | State management | 5+ |

### Backend
| Tool | Purpose | Version |
|------|---------|---------|
| Next.js API Routes | Backend endpoints | built-in |
| Prisma | ORM & migrations | 5+ |
| PostgreSQL | Primary database | 14+ |
| NextAuth.js | Authentication | 4.24+ |
| bcryptjs | Password hashing | 2.4+ |
| jsonwebtoken | JWT handling | 9+ |

### AI & Infrastructure
| Tool | Purpose | Version |
|------|---------|---------|
| OpenAI API | AI features (chat/completion) | 4+ |
| Vercel | Hosting & deployment | - |
| Redis | Caching (optional) | - |
| GitHub | Version control | - |

---

## Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- PostgreSQL database (local or Supabase/Neon)
- OpenAI API key (for AI features)
- Git

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd smartinsight-ai-blog
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/siab_db"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-..."

# JWT (optional, if using custom JWT)
JWT_SECRET="another-secret-key"
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Initialize Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
# Or push schema directly (dev only)
npx prisma db push
```

### 4. Seed Database (Optional)
```bash
npm run db:seed  # if seed script is set up
```

### 5. Start Development Server
```bash
npm run dev
```
Visit: http://localhost:3000

### 6. Open Admin Dashboard
Navigate to: http://localhost:3000/admin  
Default admin will need to be created via seed script or database.

---

## Project Structure

```
smartinsight-ai-blog/
├── app/                      # Next.js App Router
│   ├── api/                  # API route handlers
│   │   ├── auth/
│   │   ├── posts/
│   │   ├── comments/
│   │   ├── ai/
│   │   └── admin/
│   ├── blog/                 # Blog pages
│   │   ├── [slug]/           # Dynamic article page
│   │   └── page.tsx          # Blog listing
│   ├── admin/                # Admin dashboard
│   │   ├── dashboard/
│   │   ├── posts/
│   │   ├── analytics/
│   │   └── users/
│   ├── account/              # User account pages
│   ├── layout.tsx            # Root layout (themes, providers)
│   ├── page.tsx              # Homepage
│   └── globals.css           # Global styles
├── components/               # Reusable UI components
│   ├── ui/                   # Base UI components (buttons, inputs)
│   ├── layout/               # Layout components (Header, Footer)
│   ├── blog/                 # Blog-specific components
│   ├── admin/                # Admin components
│   ├── ai/                   # AI chat, summary components
│   └── shared/               # Shared logic (hooks, utils)
├── lib/                      # Utilities & helpers
│   ├── db.ts                 # Prisma client
│   ├── auth.ts               # Auth config & helpers
│   ├── ai.ts                 # OpenAI integration
│   ├── utils.ts              # General utilities
│   ├── constants.ts          # Constants (categories, etc.)
│   └── validations.ts        # Zod schemas
├── prisma/                   # Prisma schema & migrations
│   ├── schema.prisma
│   └── migrations/
├── public/                   # Static assets
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── styles/                   # CSS & Tailwind files
│   └── tailwind.css
├── types/                    # TypeScript type definitions
│   └── index.ts
├── hooks/                    # Custom React hooks
│   └── useTheme.ts
├── .env.example              # Environment template
├── next.config.js            # Next.js config
├── tailwind.config.js        # Tailwind CSS config
├── postcss.config.js         # PostCSS config
├── tsconfig.json             # TypeScript config
└── package.json
```

### File Naming Conventions
- React components: `PascalCase.tsx` (e.g., `BlogCard.tsx`)
- Utility functions: `camelCase.ts` (e.g., `formatDate.ts`)
- Hooks: `useHookName.ts` (e.g., `useTheme.ts`)
- Types: `kebab-case.ts` or `index.ts` in `types/`
- API routes: `route.ts` inside folder (e.g., `app/api/posts/route.ts`)

---

## Database

### Schema Design

The Prisma schema is located at `prisma/schema.prisma`. Key models:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  posts     Post[]
  comments  Comment[]
  createdAt DateTime @default(now())
}

model Post {
  id           String   @id @default(cuid())
  title        String
  slug         String   @unique
  content      String
  published    Boolean  @default(false)
  publishedAt  DateTime?
  author       User     @relation(fields: [authorId], references: [id])
  category     Category @relation(fields: [categoryId], references: [id])
  likes        Like[]
  comments     Comment[]
  // ...
}

// Full schema in PRD.md
```

### Common Queries

**Get published posts:**
```typescript
const posts = await prisma.post.findMany({
  where: { published: true },
  include: { author: true, category: true, tags: true },
  orderBy: { publishedAt: 'desc' },
  take: 10,
});
```

**Get post by slug with relations:**
```typescript
const post = await prisma.post.findUnique({
  where: { slug },
  include: {
    author: true,
    category: true,
    tags: true,
    comments: { where: { parentId: null }, include: { author: true, replies: true } },
    likes: { where: { userId: currentUserId } },
    bookmarks: { where: { userId: currentUserId } },
  },
});
```

### Migrations
```bash
# Create new migration after schema change
npx prisma migrate dev --name descriptive-name

# Apply migrations to production (CI/CD)
npx prisma migrate deploy

# Generate client after migration
npx prisma generate

# Reset database (dev only)
npx prisma migrate reset
```

### Seeding
Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create categories
  await prisma.category.createMany({
    data: [
      { name: 'IoT', slug: 'iot', color: '#3B82F6' },
      { name: 'Energy', slug: 'energy', color: '#10B981' },
      // ...
    ],
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.create({
    data: {
      email: 'admin@smartinsight.ai',
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
}

main();
```

Run: `npx prisma db seed`

---

## API Development

### API Route Structure

Using Next.js App Router, API routes map to files in `app/api/`:

```
app/api/
├── auth/
│   └── route.ts           # POST /api/auth (login/register)
├── posts/
│   ├── route.ts           # GET/POST /api/posts
│   └── [id]/
│       └── route.ts       # GET/PATCH/DELETE /api/posts/:id
├── comments/
│   └── route.ts           # CRUD for comments
├── ai/
│   ├── summarize/         # POST /api/ai/summarize
│   ├── chat/              # POST /api/ai/chat
│   └── recommend/         # POST /api/ai/recommend
└── admin/
    └── analytics/         # GET /api/admin/analytics
```

### Request/Response Pattern

All API responses follow consistent format:

```typescript
// Success response
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}

// Error response
{
  "success": false,
  "error": "Error message",
  "details": { ... }  // Optional error details
}
```

### Example API Route

`app/api/posts/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema
const postSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(100),
  categoryId: z.string().uuid(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');

    const where = category ? { category: { slug: category }, published: true } : { published: true };

    const posts = await prisma.post.findMany({
      where,
      include: { author: true, category: true, tags: true },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.post.count({ where });

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();

  // Check auth
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validated = postSchema.parse(body);

    // Create slug from title
    const slug = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check slug uniqueness
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Title already exists' },
        { status: 409 }
      );
    }

    const post = await prisma.post.create({
      data: {
        ...validated,
        slug,
        authorId: session.user.id,
        publishedAt: validated.published ? new Date() : null,
      },
      include: { author: true, category: true },
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
```

---

## Authentication

### NextAuth.js Configuration

**File:** `lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
```

### Protecting Routes

**Server-side protection:**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin-only logic
}
```

**Client-side protection:**
```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') return <Spinner />;
  if (!session || session.user.role !== 'ADMIN') {
    router.push('/login');
    return null;
  }

  return <AdminDashboard />;
}
```

---

## AI Integration

### OpenAI Client Setup

**File:** `lib/ai.ts`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSummary(content: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert blog summarizer. Generate a concise 3-5 bullet point summary.',
      },
      { role: 'user', content: `Summarize this article:\n\n${content.slice(0, 4000)}` },
    ],
    max_tokens: 150,
    temperature: 0.5,
  });

  return response.choices[0]?.message?.content || 'Summary unavailable';
}

export async function chatWithArticle(
  articleContent: string,
  userMessage: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an assistant for this article. Use the article content to answer questions.\n\nArticle:\n${articleContent.slice(0, 6000)}`,
      },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || 'Unable to generate response';
}

// Streaming for chat
export async function* streamChat(articleContent: string, userMessage: string) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: `Article context: ${articleContent.slice(0, 6000)}` },
      { role: 'user', content: userMessage },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content || '';
  }
}
```

### Caching AI Results

Use Redis or database to cache expensive AI calls:

```typescript
import { prisma } from '@/lib/db';

export async function getCachedSummary(postId: string) {
  const cached = await prisma.aISummary.findUnique({
    where: { postId },
  });

  const isExpired = cached && cached.expiresAt < new Date();

  if (cached && !isExpired) {
    return cached.content;
  }

  // Regenerate
  const post = await prisma.post.findUnique({ where: { id: postId } });
  const summary = await generateSummary(post.content);

  // Upsert cache
  await prisma.aISummary.upsert({
    where: { postId },
    create: { postId, content: summary, tokensUsed: 100, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    update: { content: summary, cachedAt: new Date(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  return summary;
}
```

---

## Theme System

### Theme Context Provider

**File:** `components/providers/ThemeProvider.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'black';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme') as Theme;
    if (stored && ['light', 'dark', 'black'].includes(stored)) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'black');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  if (!mounted) {
    return null; // Prevent flash of wrong theme
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### Using Themes with Tailwind

In `tailwind.config.js`:
```javascript
module.exports = {
  darkMode: 'class', // We manually toggle class
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#121212',
          surface: '#1E1E1E',
          border: '#2A2A2A',
        },
        black: {
          bg: '#000000',
          surface: '#0A0A0A',
          border: '#111111',
        },
      },
    },
  },
};
```

Usage in components:
```tsx
<div className="bg-white dark:bg-dark-bg black:bg-black-bg text-gray-900 dark:text-white">
  <p>Themed content here</p>
</div>
```

---

## Performance Optimization

### 1. Image Optimization

Always use Next.js `<Image>` component:
```tsx
import Image from 'next/image';

<Image
  src="/profile.jpg"
  alt="Profile"
  width={200}
  height={200}
  priority  // For above-the-fold images
  placeholder="blur"  // Optional blur placeholder
/>
```

### 2. Lazy Loading Components

```tsx
import dynamic from 'next/dynamic';

// Load heavy component only when needed
const ChatAssistant = dynamic(
  () => import('@/components/ai/ChatAssistant'),
  { loading: () => <Spinner />, ssr: false }
);
```

### 3. Database Query Optimization

- Use `select` to fetch only needed fields
- Use `include` efficiently (avoid N+1)
- Add indexes to frequently queried columns

```prisma
model Post {
  id         String   @id @default(cuid())
  slug       String   @unique
  published  Boolean  @default(false)
  createdAt  DateTime @default(now())
  @@index([published, createdAt])  // Composite index
}
```

### 4. Caching Strategies

- **Client-side:** React Query or SWR for data fetching
- **Server-side:** Redis for AI responses, session data
- **CDN:** Vercel Edge caching for static pages

### 5. Route Groups for Code Splitting

```
app/
├── (marketing)/     # Not included in layout
│   ├── page.tsx     # Homepage
│   └── about/page.tsx
├── (app)/           # Protected routes
│   ├── layout.tsx   # Dashboard layout
│   └── dashboard/page.tsx
└── api/             # API routes (separate bundle)
```

---

## Testing

### Unit Tests

Run: `npm test` (configure Jest or Vitest)

Example test:
```typescript
// __tests__/utils/formatDate.test.ts
import { formatDate } from '@/lib/utils';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('Jan 15, 2024');
  });
});
```

### Integration Tests (API)

Use Supertest or Playwright:

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

### E2E Critical Paths (Playwright)
1. User registration → login → logout
2. Admin creates post → publishes → view as public
3. User bookmarks article → view bookmarks
4. User comments on post → comment appears
5. AI summary loads on article page

Run E2E: `npx playwright test`

---

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Connect repo in Vercel dashboard
3. Configure environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (production URL)
   - `OPENAI_API_KEY`
4. Deploy

**Vercel Configuration (`vercel.json`):**
```json
{
  "rewrites": [
    { "source": "/sitemap.xml", "destination": "/api/sitemap" },
    { "source": "/robots.txt", "destination": "/api/robots" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

### Database in Production

Options:
1. **Supabase** (PostgreSQL + built-in auth, storage)
2. **Neon** (serverless Postgres)
3. **Railway** (managed Postgres)
4. **AWS RDS** (self-managed)

Recommended: **Supabase** for ease of use + generous free tier.

### Monitoring

- **Vercel Analytics** (built-in performance)
- **Sentry** (error tracking)
- **UptimeRobot** (uptime monitoring)
- **Google Search Console** (SEO)

---

## Troubleshooting

### Common Issues

**1. `Error: P1001: Can't reach database server`**
```bash
# Check DATABASE_URL is correct
# Ensure database is running locally or accessible
# For Docker: docker-compose up postgres
```

**2. `Error: JWT secret must be 32+ characters`**
```bash
# Generate proper secret
openssl rand -base64 32
```

**3. Theme not applying on initial load**
- Ensure `ThemeProvider` wraps your app in `layout.tsx`
- Add `suppressHydrationWarning` to `<html>` tag:

```tsx
<html lang="en" suppressHydrationWarning>
```

**4. Infinite loop in `useEffect`**
- Check dependencies array
- Avoid setting state without condition

**5. Images not optimizing**
- Use `next/image` not `<img>`
- Configure `next.config.js` with `images.domains` for external

---

## Code Style Guide

### General
- Use TypeScript for all files
- Prefer functional components with hooks
- Use `async/await` over promises
- Meaningful variable/function names
- Single responsibility per function

### Imports
```typescript
// 1. React/Next.js
import { useState } from 'react';
import { useSession } from 'next-auth/react';

// 2. Third-party
import { format } from 'date-fns';

// 3. Internal (absolute paths with @/)
import { Button } from '@/components/ui/Button';
import { prisma } from '@/lib/db';
```

### File Organization
```typescript
// First: imports
// Second: types/interfaces
// Third: component/hook/function
// Fourth: exports
```

### Comments
- Only comment WHY, not WHAT
- Use JSDoc for exported functions:

```typescript
/**
 * Generates an AI summary for a blog post
 * @param content - Full article content (max 10k chars)
 * @returns AI-generated summary (3-5 bullet points)
 */
export async function generateSummary(content: string): Promise<string> { ... }
```

---

## Contributing Guidelines

1. **Branch naming:** `feature/feature-name`, `fix/bug-description`
2. **Commit messages:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
3. **Pull Requests:**
   - Must have description
   - Must pass all CI checks
   - Must be reviewed by at least 1 team member
   - Must include screenshots for UI changes

4. **Code Review Checklist:**
   - [ ] No console.logs left in
   - [ ] TypeScript passes
   - [ ] Linting passes
   - [ ] No sensitive data exposed
   - [ ] Database queries efficient
   - [ ] UX considerations (loading states, errors)

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npm run typecheck        # TypeScript check

# Database
npx prisma studio        # Open DB GUI
npx prisma migrate dev   # Create & apply migration
npx prisma db push       # Push schema (no migration file)
npx prisma format        # Format schema

# Testing
npm test                 # Run unit tests
npx playwright test      # E2E tests
npm run test:coverage    # Coverage report

# Cleanup
rm -rf .next node_modules
npm install
```

---

## Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **NextAuth Docs:** https://next-auth.js.org/
- **OpenAI API:** https://platform.openai.com/docs
- **Framer Motion:** https://www.framer.com/motion/

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-26
