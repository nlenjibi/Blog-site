# SmartInsight AI Blog - Backend API

Node.js + Express + MongoDB + TypeScript backend for SmartInsight AI Blog.

## Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens, role-based access control (RBAC)
- **Blog Engine**: Full CRUD for posts, categories, tags, comments
- **Social Features**: Likes, bookmarks, threaded comments
- **AI Integration**: AI summaries, recommendations, chat assistant (OpenAI GPT)
- **Admin Dashboard**: Analytics, moderation, user management
- **Caching**: Redis-powered caching layer
- **Security**: Helmet, CORS, rate limiting, input validation, XSS protection
- **Logging**: Winston logging with file & console transports

## Project Structure

```
backend/
├── src/
│   ├── modules/          # Feature modules (clean architecture)
│   │   ├── auth/         # Authentication module
│   │   ├── users/        # User management
│   │   ├── posts/        # Blog posts
│   │   ├── comments/     # Comments system
│   │   ├── ai/           # AI features
│   │   └── admin/        # Admin only
│   ├── middleware/       # Express middleware
│   ├── models/          # Mongoose schemas
│   ├── utils/           # Utilities (JWT, Redis, email)
│   ├── config/          # DB & Redis config
│   ├── types/           # TypeScript types
│   ├── app.ts           # Express app setup
│   └── server.ts        # Entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
└── tsconfig.json
```

## Prerequisites

- Node.js 18+ (LTS)
- MongoDB (local or cloud)
- Redis (optional, for session caching)
- OpenAI API key (for AI features)

## Setup

1. **Clone & install**

```bash
cd backend
npm install
```

2. **Configure environment**

```bash
cp .env.example .env
```

Edit `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/smartinsight_db
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-chars
PORT=8000
NODE_ENV=development
OPENAI_API_KEY=sk-your-openai-key
REDIS_HOST=localhost
REDIS_PORT=6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

3. **Start MongoDB**

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongo mongo:latest

# Or use local installation
mongod
```

4. **Run database migrations**

```bash
# Generate Prisma client if using Prisma
# For Mongoose, collections are created automatically
```

5. **Start development server**

```bash
npm run dev
```

Server will start at `http://localhost:8000`

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout (invalidate token) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List posts (filterable) |
| GET | `/api/posts/:slug` | Get single post |
| POST | `/api/posts` | Create post (auth) |
| PATCH | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments/post/:postId` | Get comments for post |
| POST | `/api/comments` | Create comment (auth) |
| PATCH | `/api/comments/:id` | Update comment |
| DELETE | `/api/comments/:id` | Delete comment |

### AI Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/summarize` | Generate article summary |
| POST | `/api/ai/chat` | Chat with article AI |
| POST | `/api/ai/suggest-tags` | Suggest tags |
| POST | `/api/ai/seo-suggestions/:id` | SEO analysis |
| POST | `/api/ai/recommend` | Get personalized recommendations |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/analytics` | Full analytics |
| GET | `/api/admin/users` | List users |
| PATCH | `/api/admin/users/:id/role` | Update user role |
| GET | `/api/admin/comments/pending` | Pending moderation |
| POST | `/api/admin/comments/bulk-approve` | Bulk approve |

## User Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full system access, user management, content moderation |
| `editor` | Create/edit/delete any post, moderate comments |
| `author` | Create/edit own posts |
| `user` | Read content, comment, like, bookmark |

## Database Models

### User
- name, email, password, role, avatar, bio
- Automated timestamps, soft deletion support

### Post
- title, slug, content, excerpt, coverImage
- author (User), category, tags
- published, featured, publishedAt
- views, readingTime
- SEO fields: seoTitle, seoDescription, metaKeywords

### Category
- name, slug, description, color, icon
- Ordering support

### Tag
- name, slug, usageCount

### Comment
- content, post, author, parent (for threading)
- isApproved (moderation), isDeleted (soft delete)
- likes, depth (max 3 nesting)

### Like & Bookmark
- Composite unique: userId + postId

### AISummary
- post (1:1), content, modelUsed, tokensUsed
- Auto-expire via TTL index

## Caching Strategy

- **Post cache**: Individual posts cached by slug (5 min TTL)
- **List cache**: Post lists with pagination (10 min TTL)
- **AI summary**: 7 day TTL
- **Recommendations**: 24 hour TTL
- **Categories/Tags**: 1 hour TTL

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "errors": [
    { "path": "email", "message": "Invalid email format" }
  ]
}
```

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage report
npm run test -- --coverage
```

## Available Scripts

```bash
# Development
npm run dev              # Start with nodemon hot reload
npm run build            # Build TypeScript
npm start                # Start production server

# Code quality
npm run lint             # ESLint
npm run lint:fix         # ESLint fix
npm run typecheck        # TypeScript check

# Database
# (No Prisma - using Mongoose)
# Use MongoDB Compass or mongosh for direct DB access

# Testing
npm test                 # All tests
npm run test:unit        # Unit tests
npm run test:integration # Integration
npm run test:e2e         # E2E
```

## Security

- **Passwords**: Hashed with bcrypt (12 rounds)
- **Auth**: JWT access tokens (1h) + refresh tokens (7d) stored in Redis
- **Rate Limiting**: Login endpoints limited to 5 attempts per 15min
- **Input Sanitization**: express-mongo-sanitize + xss-clean
- **Headers**: Helmet.js security headers
- **CORS**: Configurable allowed origins

## Performance

- Database indexes on frequently queried fields
- Redis caching for expensive operations
- Pagination (default 10 items)
- Connection pooling via Mongoose
- CDN-ready (Vercel/CloudFront compatible)

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<long-random-string>
JWT_REFRESH_SECRET=<another-long-random-string>
OPENAI_API_KEY=sk-...
REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Docker (optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 8000
CMD ["node", "dist/server.js"]
```

### Vercel / Railway / Render

This is a standard Node.js + Express app. Deploy to any Node hosting:

1. Push to GitHub
2. Connect to hosting provider
3. Set environment variables
4. Deploy

## Monitoring

- **Error tracking**: Integrate with Sentry (recommended)
- **Uptime**: Health endpoint at `/health`
- **Logs**: File-based logs in `logs/` directory
- **Metrics**: Consider Prometheus + Grafana for production

## Development Tips

### Adding a New Module

1. Create module folder in `src/modules/<module-name>/`
2. Create: `module.types.ts`, `module.validation.ts`, `module.service.ts`,  `module.controller.ts`, `module.routes.ts`
3. Import routes in `src/app.ts`
4. Add models to `src/models/` if needed
5. Write tests in `tests/`

### Running MongoDB Locally

```bash
# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# With Docker Compose (recommended)
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    container_name: smartinsight-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

volumes:
  mongo-data:
```

### Debugging

Use VS Code debug configuration:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Server",
  "port": 9229
}
```

Start with: `npm run dev -- --inspect`

## Contributing

Follow the [system-backend.md](system-backend.md) guidelines strictly:

- Strict layered architecture: Route → Controller → Service → Model
- Use TypeScript strictly
- Follow naming conventions (kebab-case files, camelCase functions)
- All inputs validated with Zod
- Consistent error handling with AppError
- Centralized logging

## License

Proprietary - All rights reserved

## Support

For issues, please contact: dev@smartinsight.ai
