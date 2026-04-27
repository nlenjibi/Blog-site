# SmartInsight AI Blog - Frontend Documentation

## Overview

This is the frontend application for the SmartInsight AI Blog platform, built with Next.js 15, TypeScript, and Tailwind CSS. It provides a modern, responsive reading experience with AI-powered features.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4, CSS Variables for theming
- **State Management**: Zustand
- **Icons**: Lucide React
- **Forms**: React Hook Form (ready for integration)
- **Date Handling**: date-fns
- **Markdown**: react-markdown, react-syntax-highlighter

## Project Structure

```
app/
├── (home)/              # Home page with featured content
│   └── page.tsx
├── (auth)/              # Auth pages (login, register)
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── (admin)/             # Admin dashboard and tools
│   ├── dashboard/
│   │   └── page.tsx
│   └── posts/
│       └── page.tsx
├── post/
│   └── [slug]/
│       └── page.tsx     # Individual article page
├── search/
│   └── page.tsx         # Search results page
├── profile/
│   └── [id]/
│       └── page.tsx     # User profile page
├── categories/
│   └── page.tsx         # Category listing page
├── post/
│   └── new/
│       └── page.tsx     # Create new post
├── layout.tsx           # Root layout with theme provider
└── globals.css          # Global styles and theme variables

components/
├── common/              # Common components
├── layout/              # Layout components (Header, Footer, ThemeProvider)
├── ui/                  # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Input.tsx
│   ├── Textarea.tsx
│   ├── Modal.tsx
│   ├── AlertDialog.tsx
│   ├── Avatar.tsx
│   ├── Skeleton.tsx
│   ├── Toast.tsx
│   └── LoadingSpinner.tsx
├── posts/               # Post-specific components
│   ├── PostCard.tsx
│   ├── CommentSection.tsx
│   └── LikeButton.tsx
└── auth/                # Auth components
    └── AuthProvider.tsx

lib/
├── api.ts               # API client and typed endpoints
└── utils.ts             # Utility functions

services/
├── posts.ts             # Post API service

stores/
└── useAuthStore.ts      # Auth state management

types/
└── index.ts             # TypeScript type definitions
```

## Features

### 1. Content Discovery
- Homepage with featured articles carousel
- Category-based filtering
- Infinite scroll feed
- AI-powered semantic search
- Popular tags cloud

### 2. Reading Experience
- Clean, distraction-free article layout
- AI-generated summaries
- Reading time estimation
- Progress indicator
- Sticky table of contents
- Social sharing

### 3. User Interactions
- Like/Reaction system
- Bookmarking
- Threaded comments (max depth: 3)
- Markdown support in comments
- Real-time engagement updates

### 4. Personalization
- Theme switching (Light, Dark, Black AMOLED)
- Reading history
- Personalized recommendations
- User profile customization

### 5. Content Creation (Admin/Author)
- Rich text/markdown editor
- Auto-save drafts
- Post scheduling
- Media upload
- SEO suggestions
- AI draft generation

### 6. Admin Dashboard
- Post management
- User management
- Analytics overview
- Comment moderation
- Site statistics

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- Backend server running on http://localhost:5000 (default)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Configure environment variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Run development server:
```bash
npm run dev
```

5. Open http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler

## API Integration

The frontend connects to the backend API at `NEXT_PUBLIC_API_URL`. All API calls are typed and handled through the `api.ts` client.

### Key Endpoints

- `GET /api/posts` - List posts with filters
- `GET /api/posts/:slug` - Get single post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/bookmark` - Bookmark/unbookmark
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/comments` - Create comment
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

## Theming

The app supports three themes:

1. **Light** - Default light mode
2. **Dark** - Dark mode for low-light environments
3. **Black (AMOLED)** - True black for OLED screens

Themes are configured in `globals.css` using CSS variables and can be switched via the header menu. Theme preference is persisted in localStorage.

## State Management

Zustand is used for client-side state management:

- **AuthStore** - Authentication state (user, token, isAuthenticated)
- **ThemeStore** - Theme preference
- **ToastStore** - Notification system

All stores support persistence where appropriate.

## Component Library

### UI Components

All components are built with Tailwind CSS and support:
- Responsive design
- Dark/light theme compatibility
- Accessibility (ARIA labels, keyboard navigation)
- Animation support (respects `prefers-reduced-motion`)

### Custom Components

- **PostCard** - Displays post preview with image, metadata, and actions
- **CommentSection** - Nested comments with reply support
- **LikeButton** - Animated like button with count
- **AISummary** - Collapsible AI-generated summary section

## Performance Optimizations

- Code splitting with Next.js dynamic imports
- Image optimization with Next.js Image component
- Lazy loading for images and components
- Virtual scrolling for long lists (implemented via intersection observer)
- Debounced search input
- Client-side caching with Zustand

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Focus visible states
- Keyboard navigation support
- Color contrast compliant with WCAG 2.1 AA
- Respects `prefers-reduced-motion`
- Skip-to-content link

## Testing

Tests are located in `__tests__` directories and use Jest with React Testing Library.

Run tests:
```bash
npm test
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Security Considerations

- JWT tokens for authentication
- XSS protection via content sanitization
- CSRF protection
- Rate limiting on API routes
- Input validation with Zod
- No sensitive data stored client-side

## Deployment

The app can be deployed to:
- Vercel (recommended)
- Netlify
- GitHub Pages
- Any static hosting service

For Vercel:
```bash
vercel
```

## Contributing

1. Follow the existing code style (Tailwind, TypeScript, ESLint)
2. Write tests for new features
3. Update TypeScript types as needed
4. Ensure all components are accessible
5. Test on mobile and desktop

## Troubleshooting

### Build Errors
- Ensure Node.js version is 18.0 or higher
- Check that all dependencies are installed
- Verify TypeScript types are correct

### API Connection Issues
- Confirm backend is running on the correct port
- Check CORS configuration in backend
- Verify environment variables

### Theme Not Working
- Clear localStorage
- Hard refresh browser (Ctrl+F5)
- Check for CSS variable conflicts

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## License

MIT - See LICENSE file for details
