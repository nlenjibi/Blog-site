"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Clock,
  Calendar,
  User,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ArrowLeft,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CommentSection } from '@/components/posts/CommentSection';
import { LikeButton } from '@/components/posts/LikeButton';
import { cn } from '@/lib/utils';
import { postsApi, aiApi } from '@/services/posts';
import type { Post, Comment } from '@/types';

// AISSummary component
function AISSummary({ post, onRegenerate }: { post: Post; onRegenerate?: () => void }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    // Check if summary exists in post data (from API)
    if (post.content && post.content.length > 500) {
      // Generate a simple extract as fallback
      const extract = post.content.substring(0, 500) + '...';
      setSummary(extract);
    }
  }, [post]);

  const generateSummary = async () => {
    setIsRegenerating(true);
    try {
      await aiApi.summarize({ postId: post._id, content: post.content });
      // In a real implementation, this would fetch the generated summary
      const newSummary = post.content.substring(0, 400) + '...';
      setSummary(newSummary);
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!summary && !post.excerpt) return null;

  return (
    <Card className="mb-8 border-l-4 border-primary bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="h-3 w-3 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="font-semibold text-primary">AI Summary</span>
              <Badge variant="outline" className="ml-2">
                Beta
              </Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {summary || post.excerpt}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse summary' : 'Expand summary'}
          >
            <svg
              className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={generateSummary}
            disabled={isRegenerating}
            className="text-xs"
          >
            {isRegenerating ? (
              <>
                <div className="mr-1 animate-spin rounded-full border-2 border-current border-t-transparent h-3 w-3" />
                Generating...
              </>
            ) : (
              'Regenerate'
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            Powered by SmartInsight AI
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PostPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const response = await postsApi.getBySlug(slug);
        if (response.success && response.data) {
          const postData = response.data;
          setPost(postData);
          setIsLiked(postData.isLiked || false);
          setLikeCount(postData.likesCount || 0);
          setIsBookmarked(postData.isBookmarked || false);

          // Fetch comments
          const commentsRes = await postsApi.getComments(postData._id);
          if (commentsRes.success && commentsRes.data) {
            setComments(commentsRes.data);
          }

          // Fetch related posts
          const relatedRes = await postsApi.getRelated(postData._id);
          if (relatedRes.success && relatedRes.data) {
            setRelatedPosts(relatedRes.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch post:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleLike = async () => {
    if (!post) return;
    try {
      await postsApi.like(post._id);
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    try {
      await postsApi.bookmark(post._id);
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error('Failed to bookmark post:', err);
    }
  };

  const handleShare = async (platform?: string) => {
    const url = window.location.href;
    const title = post?.title || '';

    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleCommentSubmit = async (data: { content: string; parentId?: string }) => {
    if (!post) return;
    try {
      const response = await postsApi.comments.create({
        post: post._id,
        content: data.content,
        ...(data.parentId && { parent: data.parentId }),
      });
      if (response.success && response.data) {
        // Refresh comments
        const commentsRes = await postsApi.getComments(post._id);
        if (commentsRes.success && commentsRes.data) {
          setComments(commentsRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-6 w-1/4 bg-muted rounded animate-pulse" />
            <div className="aspect-video bg-muted rounded-xl animate-pulse" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
          <p className="text-muted-foreground mb-4">The article you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-background">
      {/* Article Header */}
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="mb-6"
            >
              <Link href="/" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Articles
              </Link>
            </Button>

            {/* Category Badge */}
            {post.category && (
              <Badge
                variant="outline"
                className="mb-4"
                style={{ color: post.category.color, borderColor: post.category.color }}
              >
                {post.category.name}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              {post.title}
            </h1>

            {/* Author & Meta */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Avatar
                  src={post.author?.avatar}
                  alt={post.author?.name}
                  fallback={post.author?.name?.charAt(0)}
                  size="sm"
                />
                <span className="font-medium">{post.author?.name}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.publishedAt || post.createdAt), 'MMMM d, yyyy')}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {post.readingTime} min read
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-4 w-4" />
                {post.views?.toLocaleString() || 0} views
              </span>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <Badge key={tag.name} variant="secondary">
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Featured Image */}
            {post.coverImage && (
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl mb-8 bg-muted">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* AI Summary */}
            <AISSummary post={post} />

            {/* Actions Bar */}
            <Card className="sticky top-20 z-10 mb-8 border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <LikeButton
                      isLiked={isLiked}
                      likeCount={likeCount}
                      onLike={handleLike}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">
                        {comments.length}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBookmark}
                      className="gap-1"
                    >
                      <Bookmark
                        className={cn(
                          'h-4 w-4 transition-colors',
                          isBookmarked && 'fill-current text-primary'
                        )}
                      />
                      <span className="hidden sm:inline">
                        {isBookmarked ? 'Saved' : 'Save'}
                      </span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('facebook')}
                      aria-label="Share on Facebook"
                    >
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('twitter')}
                      aria-label="Share on X"
                    >
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('linkedin')}
                      aria-label="Share on LinkedIn"
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare()}
                      aria-label="Copy link"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight">
              <div
                className="text-foreground leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {/* Author Info */}
            <Card className="mt-12">
              <CardContent className="flex items-center gap-4 p-6">
                <Avatar
                  src={post.author?.avatar}
                  alt={post.author?.name}
                  fallback={post.author?.name?.charAt(0)}
                  size="lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{post.author?.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    Tech enthusiast and content creator passionate about AI, technology, and innovation.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/profile/${post.author?._id}`}>View Profile</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <div className="mt-12">
              <CommentSection
                postId={post._id}
                comments={comments}
                onCommentSubmit={handleCommentSubmit}
              />
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 border-t bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-8">Related Articles</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    variant="default"
                    showCategory
                    showAuthor
                    showStats
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
