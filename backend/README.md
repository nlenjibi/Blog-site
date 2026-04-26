# SmartInsight AI Blog Backend

Production-ready Node.js + Express + MongoDB + TypeScript backend API for SmartInsight AI Blog.

## Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens, role-based access control
- **User Management**: Profiles, roles, multi-tenancy support
- **Blog Posts**: CRUD with pagination, filtering, categories, tags
- **Comments**: Nested/threaded comments with moderation
- **AI Integration**: Article summarization, chat assistant, recommendations, tag suggestions
- **Admin Dashboard**: Analytics, user management, content moderation
- **Security**: Helmet, CORS, rate limiting, input validation, SQL/Mongo injection prevention
- **Monitoring**: Request logging, error tracking, performance metrics

## Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis (optional for production rate limiting)
- SMTP server (for email verification)

## Installation

```bash
# Clone and setup
cd backend
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

## Environment Variables

See `.env.example` for all required configuration.

Key variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (change in production!)
- `SMTP_USER/PASS` - Email server credentials
- `AI_API_KEY` - OpenAI API key for AI features

## Running the Application

### Development (with hot reload)
```bash
npm run dev
```
Server runs at http://localhost:8080

### Production
```bash
npm run build
npm start
```

### Testing
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

## API Documentation

Base URL: `http://localhost:8080/api/v1`

### Authentication
```
POST   /api/v1/auth/register      - Register user
POST   /api/v1/auth/login         - Login
POST   /api/v1/auth/logout        - Logout
POST   /api/v1/auth/refresh       - Refresh token
GET    /api/v1/auth/me            - Current user
```

### Users
```
GET    /api/v1/users/profile      - Get profile
PATCH  /api/v1/users/profile      - Update profile
GET    /api/v1/users/:id          - Get user by ID
```

### Posts
```
GET    /api/v1/posts              - List posts (paginated)
GET    /api/v1/posts/:slug        - Get post by slug
POST   /api/v1/posts              - Create post (AUTHOR/EDITOR/ADMIN)
PATCH  /api/v1/posts/:id          - Update post (owner or admin)
DELETE /api/v1/posts/:id          - Delete post (owner or admin)
GET    /api/v1/posts/:id/comments - Get post comments
```

### Comments
```
POST   /api/v1/comments           - Create comment (auth)
PATCH  /api/v1/comments/:id       - Update comment (owner)
DELETE /api/v1/comments/:id       - Delete comment (owner or admin)
GET    /api/v1/comments/post/:postId - Get comments for post
```

### AI Features
```
POST   /api/v1/ai/summarize       - Generate article summary
POST   /api/v1/ai/chat            - Chat with article assistant
POST   /api/v1/ai/recommend       - Get recommended posts
POST   /api/v1/ai/suggest-tags    - Suggest tags for article
```

### Admin
```
GET    /api/v1/admin/analytics    - Dashboard metrics
GET    /api/v1/admin/users        - List all users
PATCH  /api/v1/admin/users/:id/role - Update user role
GET    /api/v1/admin/comments/pending - Pending comments
```

## Architecture

### Layer Structure
```
Route → Controller → Service → Repository → Model
```
- **Routes**: Endpoint definitions & middleware chain
- **Controllers**: HTTP handling, status codes, response formatting
- **Services**: Business logic implementation
- **Repositories**: Database query abstraction
- **Models**: Mongoose schemas & types

### Project Structure
```
backend/
├── src/
│   ├── modules/          # Feature modules
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── models/           # Mongoose models
│   ├── utils/            # Helper utilities
│   ├── types/            # TypeScript declarations
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── tests/                # Test suites
├── package.json
├── tsconfig.json
└── README.md
```

## Security

- Password hashing with bcrypt (12 rounds)
- JWT access + refresh tokens
- HTTP-only refresh cookies
- Rate limiting (5 login attempts per 15min)
- CORS with credentials
- Helmet.js security headers
- MongoDB injection prevention
- XSS prevention
- Input validation with Zod

## Error Handling

Standardized error response format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["detailed error array"]
}
```

## User Roles

- `USER` - Can read, comment, bookmark
- `AUTHOR` - Can create, edit own posts
- `EDITOR` - Can edit any post, publish content
- `ADMIN` - Full system access, user management

## Database Indexes

- Users: `email` (unique)
- Posts: `slug` (unique), `author`, `category`, `published`, `createdAt`
- Comments: `post`, `parent`, `createdAt`
- Likes: `{userId, post}` (compound unique)
- Bookmarks: `{userId, post}` (compound unique)

## Testing Strategy

- **Unit**: Service functions, utilities (Jest)
- **Integration**: API endpoints with DB (SuperTest)
- **E2E**: Full user journeys

## CI/CD Considerations

- Ensure tests pass: `npm test`
- Build TypeScript: `npm run build`
- Run linter: `npm run lint`

## Deployment

### Environment
- Set NODE_ENV=production
- Use managed MongoDB (Atlas) or similar
- Configure Redis for rate limiting in production
- Set proper CORS_ORIGIN to your frontend URL
- Use strong JWT secrets (32+ chars)

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

## Support

For issues or questions, please open a GitHub issue.
