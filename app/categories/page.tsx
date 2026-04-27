"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PostCard } from '@/components/posts/PostCard';
import { cn } from '@/lib/utils';
import { postsApi } from '@/services/posts';
import type { Post } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

// Mock categories data
const CATEGORIES_DATA = [
  {
    _id: 'iot',
    name: 'IoT & Smart Systems',
    slug: 'iot',
    description: 'Connected devices, sensors, and smart infrastructure',
    color: '#8b5cf6',
    postCount: 0,
  },
  {
    _id: 'energy',
    name: 'Energy & Sustainability',
    slug: 'energy',
    description: 'Renewables, smart grids, and efficiency solutions',
    color: '#10b981',
    postCount: 0,
  },
  {
    _id: 'food',
    name: 'Food & AgriTech',
    slug: 'food',
    description: 'Precision agriculture and food technology',
    color: '#ef4444',
    postCount: 0,
  },
  {
    _id: 'healthcare',
    name: 'Healthcare & Smart Hospitals',
    slug: 'healthcare',
    description: 'Medical IoT and telemedicine innovations',
    color: '#3b82f6',
    postCount: 0,
  },
  {
    _id: 'technology',
    name: 'General Technology',
    slug: 'technology',
    description: 'AI, blockchain, and emerging technologies',
    color: '#f59e0b',
    postCount: 0,
  },
];

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState(CATEGORIES_DATA);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Fetch posts for a category
  const fetchCategoryPosts = async (slug: string) => {
    setIsLoading(true);
    try {
      const response = await postsApi.list({
        category: slug,
        published: true,
        limit: 12,
        page: 1,
      });
      if (response.success && response.data) {
        setPosts(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch category posts:', err);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all categories with post counts
  const fetchCategoriesWithCounts = async () => {
    setCategoryLoading(true);
    try {
      // For each category, fetch post count
      const updatedCategories = await Promise.all(
        CATEGORIES_DATA.map(async (cat) => {
          try {
            const response = await postsApi.list({
              category: cat.slug,
              published: true,
              limit: 1,
              page: 1,
            });
            const totalCount = response.success && response.pagination
              ? response.pagination.total || 0
              : 0;
            return { ...cat, postCount: totalCount };
          } catch (err) {
            return cat;
          }
        })
      );
      setCategories(updatedCategories);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesWithCounts();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryPosts(selectedCategory);
    } else {
      setPosts([]);
    }
  }, [selectedCategory]);

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug === selectedCategory ? null : slug);
  };

  const selectedCategoryData = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        </div>
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 mb-6">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Explore Categories
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Discover Content by Category
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Browse our curated collection of articles across IoT, Energy, Food, Healthcare, and Technology.
              Find insights that matter to you.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">All Categories</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categoryLoading
              ? [...Array(6)].map((_, i) => (
                  <div key={i} className="animate-fade-in-up">
                    <Card className="h-full">
                      <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/4" />
                      </CardContent>
                    </Card>
                  </div>
                ))
              : categories.map((category, index) => (
                  <div
                    key={category._id}
                    className={cn(
                      'animate-fade-in-up',
                      { 'delay-100': index === 1, 'delay-200': index === 2, 'delay-300': index === 3 }
                    )}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Card
                      className={cn(
                        'h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
                        selectedCategory === category.slug && 'ring-2 ring-primary shadow-lg'
                      )}
                      onClick={() => handleCategoryClick(category.slug)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <Layers className="h-6 w-6" style={{ color: category.color }} />
                          </div>
                          <Badge
                            variant="outline"
                            style={{ color: category.color, borderColor: category.color }}
                          >
                            {category.postCount} articles
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          {category.description}
                        </p>
                        <div className="flex items-center text-sm text-primary font-medium">
                          View articles
                          <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* Category Posts */}
      {selectedCategory && selectedCategoryData && (
        <section className="py-16 border-t bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to categories
              </Button>
              <div>
                <h2 className="text-2xl font-bold">{selectedCategoryData.name}</h2>
                <p className="text-muted-foreground">
                  {selectedCategoryData.description}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            ) : posts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, index) => (
                  <div
                    key={post._id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <PostCard
                      post={post}
                      variant="default"
                      showCategory={false}
                      showAuthor
                      showStats
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Layers className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No articles in this category yet
                </h3>
                <p className="text-muted-foreground">
                  Check back soon for new content in {selectedCategoryData.name}.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
