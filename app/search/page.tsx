"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PostCard } from '@/components/posts/PostCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { postsApi } from '@/services/posts';
import type { Post } from '@/types';

const CATEGORIES = [
  { name: 'All', slug: '' },
  { name: 'IoT', slug: 'iot' },
  { name: 'Energy', slug: 'energy' },
  { name: 'Food', slug: 'food' },
  { name: 'Healthcare', slug: 'healthcare' },
  { name: 'Technology', slug: 'technology' },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async (searchQuery: string, category: string = '') => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await postsApi.list({
        search: searchQuery,
        category: category || undefined,
        published: true,
        limit: 20,
        page: 1,
      });

      if (response.success && response.data) {
        setResults(response.data);
        setTotalResults(response.pagination?.total || 0);
      } else {
        setResults([]);
        setTotalResults(0);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, selectedCategory);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, selectedCategory);
  };

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    if (query) {
      performSearch(query, slug);
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 px-0.5 rounded-none">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-background py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Search Header */}
          <div className="mb-8 md:mb-12">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">
              Search Articles
            </h1>
            
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-3">
                <div className="relative flex-1 max-w-2xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by title, content, or tags..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </form>

            {/* Category Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.slug}
                  variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryChange(cat.slug)}
                  className="whitespace-nowrap"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          {hasSearched && !isLoading && (
            <div className="mb-6">
              <p className="text-muted-foreground">
                Found <span className="font-medium text-foreground">{totalResults}</span>{' '}
                result{totalResults !== 1 ? 's' : ''}
                {selectedCategory && (
                  <> in <span className="font-medium text-primary capitalize">{selectedCategory}</span></>
                )}
                {query && (
                  <> for <span className="font-medium text-primary">"{query}"</span></>
                )}
              </p>
            </div>
          )}

          {/* Results */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-fade-in-up">
                  <Card className="h-full">
                    <Card className="aspect-video rounded-xl bg-muted" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {results.map((post, index) => (
                <div key={post._id} className="animate-fade-in-up">
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
          ) : hasSearched ? (
            <div className="text-center py-16">
              <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No results found
              </h3>
              <p className="text-muted-foreground mb-6">
                Try different keywords or adjust your search filters.
              </p>
              <Button variant="outline" onClick={() => setQuery('')}>
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Search Articles
              </h3>
              <p className="text-muted-foreground">
                Find insights on IoT, Energy, Food, Healthcare, and Technology.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
