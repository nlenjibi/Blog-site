"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Users, FileText, Eye, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { PostCard } from '@/components/posts/PostCard';
import type { Post } from '@/types';

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  totalViews: number;
  totalUsers: number;
  recentPosts: Post[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch posts
      const postsRes = await api.get('/posts?limit=5&page=1&published=true');
      const allPostsRes = await api.get('/posts?limit=1&page=1&published=false');
      
      const publishedPosts = postsRes.success ? (postsRes.data?.data || postsRes.data || []) : [];
      const totalPostsRes = await api.get('/posts?limit=1&page=1');
      const totalPosts = totalPostsRes.success ? totalPostsRes.data?.total || 0 : 0;

      const recentPosts = Array.isArray(publishedPosts) ? publishedPosts.slice(0, 5) : [];

      const totalViews = recentPosts.reduce((sum, post) => sum + (post.views || 0), 0);

      // Estimate users (in real app, fetch from /admin/users)
      const totalUsers = 150;

      setStats({
        totalPosts,
        publishedPosts: publishedPosts.length,
        totalViews,
        totalUsers,
        recentPosts,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Posts',
      value: stats?.totalPosts || 0,
      icon: FileText,
      change: '+12%',
      changePositive: true,
    },
    {
      title: 'Published Posts',
      value: stats?.publishedPosts || 0,
      icon: Eye,
      change: '+8%',
      changePositive: true,
    },
    {
      title: 'Total Views',
      value: stats?.totalViews?.toLocaleString() || 0,
      icon: BarChart3,
      change: '+23%',
      changePositive: true,
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers?.toLocaleString() || 0,
      icon: Users,
      change: '+5%',
      changePositive: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Overview of your SmartInsight platform
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/posts">
                  Manage Posts
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild>
                <Link href="/post/new">
                  <FileText className="h-4 w-4 mr-2" />
                  New Post
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <div
              key={stat.title}
              className={cn(
                'animate-fade-in-up',
                { 'delay-100': index === 1, 'delay-200': index === 2, 'delay-300': index === 3 }
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card className="relative overflow-hidden">
                <div className="absolute right-0 top-0 h-20 w-20 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <span className={cn(
                        'text-sm font-medium',
                        stat.changePositive ? 'text-green-600' : 'text-red-600'
                      )}>
                        {stat.change}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {isLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        stat.value
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Recent Posts */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Published Posts</h2>
            <Button variant="outline" asChild>
              <Link href="/admin/posts">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(3)].map((_, i) => (
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
          ) : !stats?.recentPosts || stats.recentPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No published posts yet.</p>
              <Button className="mt-4" asChild>
                <Link href="/post/new">Create Your First Post</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {stats.recentPosts.map((post, index) => (
                <div
                  key={post._id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
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
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Create New Post</h3>
                  <p className="text-sm text-muted-foreground">Write and publish content</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Users</h3>
                  <p className="text-sm text-muted-foreground">View and manage all users</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">View Analytics</h3>
                  <p className="text-sm text-muted-foreground">Platform performance metrics</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
