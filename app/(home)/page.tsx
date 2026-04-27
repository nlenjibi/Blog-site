"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, SlidersHorizontal, Newspaper, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PostCard } from '@/components/posts/PostCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { postsApi } from '@/services/posts';
import type { Post } from '@/types';

const CATEGORIES_ALL = [
  { name: 'All', slug: '', color: '#6b7280' },
  { name: 'IoT & Smart Systems', slug: 'iot', color: '#8b5cf6' },
  { name: 'Energy & Sustainability', slug: 'energy', color: '#10b981' },
  { name: 'Food & AgriTech', slug: 'food', color: '#ef4444' },
  { name: 'Healthcare', slug: 'healthcare', color: '#3b82f6' },
  { name: 'General Tech', slug: 'technology', color: '#f59e0b' },
];

const POSTS_PER_PAGE = 10;

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch featured posts
  const fetchFeaturedPosts = useCallback(async () => {
    try {
      const response = await postsApi.featured();
      if (response.success && response.data) {
        setFeaturedPosts(response.data.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to fetch featured posts:', err);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      // For now, use predefined categories. In a real app, fetch from API
      setCategories(CATEGORIES_ALL);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  // Fetch all posts
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      const response = await postsApi.list({
        page: pageNum,
        limit: POSTS_PER_PAGE,
        category: selectedCategory || undefined,
        search: debouncedSearch || undefined,
        published: true,
      });

      if (response.success && response.data) {
        const newPosts = response.data || [];
        const newTotalPages = response.pagination?.totalPages || 1;
        
        if (append) {
          setPosts(prev => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }
        
        setHasMore(pageNum < newTotalPages);
      } else {
        if (!append) setPosts([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      if (!append) setPosts([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedCategory, debouncedSearch]);

  // Initial load
  useEffect(() => {
    fetchFeaturedPosts();
    fetchCategories();
  }, [fetchFeaturedPosts, fetchCategories]);

  // Load posts when filters change
  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    fetchPosts(1, false);
  }, [selectedCategory, debouncedSearch, fetchPosts]);

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle URL search param
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setIsLoadingMore(true);
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchPosts(page, true);
    }
  }, [page, fetchPosts]);

  // Filter posts client-side for instant feedback
  useEffect(() => {
    let filtered = [...posts];
    
    if (selectedCategory) {
      filtered = filtered.filter(post => 
        post.category?.slug === selectedCategory
      );
    }
    
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.content?.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.name.toLowerCase().includes(query))
      );
    }
    
    setFilteredPosts(filtered);
  }, [posts, selectedCategory, debouncedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setPage(1);
  };

  // Featured section hero card
  const FeaturedPostHero = ({ post }: { post: Post }) => (
    <Link href={`/post/${post.slug}`} className="group block">
      <div className="relative aspect-[2/1] overflow-hidden rounded-2xl bg-muted">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
            <span className="text-6xl font-bold text-primary/20">
              {post.title.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent" />
        <div className="absolute bottom-0 p-6 md:p-8">
          {post.category && (
            <Badge
              variant="outline"
              className="mb-3 bg-white/20 backdrop-blur-sm text-white border-white/30"
              style={{ color: post.category.color }}
            >
              {post.category.name}
            </Badge>
          )}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 line-clamp-2 leading-tight">
            {post.title}
          </h2>
          <p className="text-sm md:text-base text-white/80 mb-4 line-clamp-2 max-w-2xl">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-4 text-white/70 text-sm">
            <span>{post.author?.name}</span>
            <span>•</span>
            <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}</span>
            <span>•</span>
            <span>{post.readingTime} min read</span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Featured Posts */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]" />
        </div>

        <div className="relative container mx-auto px-4 py-12 md:py-16">
          {/* Main Featured Post */}
          {featuredPosts.length > 0 && (
            <div className="mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  Featured Stories
                </span>
              </h2>
              <FeaturedPostHero post={featuredPosts[0]} />
            </div>
          )}

          {/* Secondary Featured Posts Grid */}
          {featuredPosts.length > 1 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12 md:mb-16">
              {featuredPosts.slice(1, 4).map((post, index) => (
                <div
                  key={post._id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <PostCard
                    post={post}
                    variant="featured"
                    showAuthor
                    showStats
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="relative py-8 md:py-12">
        <div className="container mx-auto px-4">
          {/* Search and Filter Bar */}
          <div className="mb-8 md:mb-12">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search articles by title, content, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {(isLoading || isLoadingMore) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                </div>
              </form>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>

              {/* Category Filter - Desktop */}
              <div className="hidden lg:flex items-center gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.slug}
                    variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={cn(
                      'whitespace-nowrap transition-all duration-200',
                      selectedCategory === cat.slug && 'shadow-md'
                    )}
                    style={
                      selectedCategory === cat.slug
                        ? { backgroundColor: cat.color, borderColor: cat.color }
                        : { borderColor: cat.color }
                    }
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category Filter - Mobile Dropdown */}
            {isFilterOpen && (
              <div className="lg:hidden mt-4 p-4 rounded-lg border bg-card animate-fade-in-up">
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat.slug}
                      variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        handleCategoryChange(cat.slug);
                        setIsFilterOpen(false);
                      }}
                      className={cn(
                        'whitespace-nowrap',
                        selectedCategory === cat.slug && 'shadow-sm'
                      )}
                      style={
                        selectedCategory === cat.slug
                          ? { backgroundColor: cat.color, borderColor: cat.color }
                          : { borderColor: cat.color }
                      }
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                'Loading...'
              ) : (
                <>
                  Showing <span className="font-medium text-foreground">{filteredPosts.length}</span>{' '}
                  {selectedCategory && (
                    <>
                      in <span className="font-medium text-primary capitalize">{selectedCategory}</span>{' '}
                    </>
                  )}
                  {debouncedSearch && (
                    <>
                      for <span className="font-medium text-primary">"{debouncedSearch}"</span>
                    </>
                  )}
                  articles
                </>
              )}
            </p>
          </div>

          {/* Posts Grid */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-fade-in-up">
                  <Card className="h-full">
                    <CardHeader className="p-0">
                      <Skeleton className="aspect-video rounded-none" />
                    </CardHeader>
                    <CardContent className="space-y-3 p-6">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post, index) => (
                  <div
                    key={post._id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <PostCard
                      post={post}
                      variant="default"
                      showCategory
                      showAuthor
                      showStats
                    />
                  </div>
                ))}
              </div>

              {/* Load More Indicator */}
              {hasMore && (
                <div ref={observerTarget} className="mt-12 text-center">
                  {isLoadingMore ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="animate-spin h-5 w-5 rounded-full border-2 border-primary border-t-transparent" />
                      <span>Loading more articles...</span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Scroll for more</p>
                  )}
                </div>
              )}

              {!hasMore && filteredPosts.length > 0 && (
                <p className="text-center text-muted-foreground mt-12 py-8 border-t">
                  You've reached the end of the articles
                </p>
              )}
            </>
          ) : (
            !isLoading && (
              <div className="text-center py-16 md:py-24">
                <Newspaper className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No articles found
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {debouncedSearch || selectedCategory
                    ? 'Try adjusting your search or filter criteria'
                    : 'No articles available yet. Check back soon!'}
                </p>
                {(debouncedSearch || selectedCategory) && (
                  <Button onClick={() => {
                    setSearchQuery('');
                    setDebouncedSearch('');
                    setSelectedCategory('');
                  }}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
