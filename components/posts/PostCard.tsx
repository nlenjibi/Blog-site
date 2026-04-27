import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Bookmark, Heart, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import type { Post } from '@/types';

export interface PostCardProps {
  post: Post;
  variant?: 'default' | 'featured' | 'compact';
  showCategory?: boolean;
  showAuthor?: boolean;
  showStats?: boolean;
  className?: string;
}

export const PostCard = React.forwardRef<HTMLArticleElement, PostCardProps>(
  (
    {
      post,
      variant = 'default',
      showCategory = true,
      showAuthor = true,
      showStats = true,
      className,
    },
    ref
  ) => {
    const isFeatured = variant === 'featured';
    const isCompact = variant === 'compact';

    return (
      <article
        ref={ref}
        className={cn(
          'group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
          isFeatured && 'md:col-span-2',
          className
        )}
      >
        {/* Category Badge */}
        {showCategory && post.category && (
          <div className="absolute top-3 left-3 z-10">
            <Badge
              variant="info"
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
              style={{ color: post.category.color }}
            >
              {post.category.name}
            </Badge>
          </div>
        )}

        {/* Featured Badge */}
        {post.featured && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="warning" className="bg-yellow-500/90">
              Featured
            </Badge>
          </div>
        )}

        {/* Cover Image */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={isFeatured}
              sizes={isFeatured ? '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-4xl font-bold text-primary/20">
                {post.title.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className={cn('p-5', isCompact && 'p-3')}>
          {/* Title */}
          <Link href={`/post/${post.slug}`} className="block group/title">
            <h3
              className={cn(
                'font-bold leading-tight text-card-foreground transition-colors group-hover/title:text-primary',
                isFeatured
                  ? 'text-xl md:text-2xl line-clamp-2'
                  : isCompact
                  ? 'text-sm line-clamp-1'
                  : 'text-lg line-clamp-2'
              )}
            >
              {post.title}
            </h3>
          </Link>

          {/* Excerpt */}
          {!isCompact && post.excerpt && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="mt-3 flex items-center justify-between">
            {/* Author & Date */}
            {showAuthor && (
              <div className="flex items-center gap-2">
                <Avatar
                  src={post.author?.avatar}
                  alt={post.author?.name}
                  fallback={post.author?.name?.charAt(0)}
                  size="sm"
                />
                <div className="flex flex-col text-xs">
                  <span className="font-medium text-card-foreground">
                    {post.author?.name}
                  </span>
                  <span className="text-muted-foreground">
                    {format(new Date(post.publishedAt || post.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            )}

            {/* Reading Time */}
            <span className="text-xs text-muted-foreground">
              {post.readingTime} min read
            </span>
          </div>

          {/* Stats & Actions */}
          {showStats && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Likes */}
                <button
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                  aria-label={`${post.likesCount || 0} likes`}
                >
                  <Heart
                    className={cn(
                      'h-4 w-4 transition-colors',
                      post.isLiked
                        ? 'fill-red-500 stroke-red-500'
                        : 'stroke-current'
                    )}
                  />
                  <span className={cn(post.isLiked && 'text-red-500 font-medium')}>
                    {post.likesCount || 0}
                  </span>
                </button>

                {/* Comments */}
                <button
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  aria-label={`${post.commentsCount || 0} comments`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.commentsCount || 0}</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="Bookmark"
                >
                  <Bookmark
                    className={cn(
                      'h-4 w-4 transition-colors',
                      post.isBookmarked && 'fill-current text-primary'
                    )}
                  />
                </button>
                <button
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="Share"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.name}
                  variant="outline"
                  className="text-xs bg-transparent"
                >
                  #{tag.name}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge variant="outline" className="text-xs bg-transparent">
                  +{post.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </article>
    );
  }
);

PostCard.displayName = 'PostCard';

export { PostCard };
