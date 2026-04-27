"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import Link from 'next/link';
import { format } from 'date-fns';
import { User, Calendar, BookOpen, Heart, MessageCircle, Edit, Settings, Eye } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PostCard } from '@/components/posts/PostCard';
import { api } from '@/lib/api';
import type { User as UserType, Post } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Separator } from '@/components/ui/Separator';

export default function ProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const { user: currentUser } = useAuthStore();

  const [profileUser, setProfileUser] = useState<UserType | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'bookmarks'>('posts');
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);

  const isOwnProfile = currentUser?._id === userId;

  useEffect(() => {
    if (!userId) return;

    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const userRes = await api.get<UserType>(`/users/${userId}`);
        if (userRes.success && userRes.data) {
          setProfileUser(userRes.data);
        }

        const postsRes = await api.get<{ data: Post[] }>(`/posts?author=${userId}&published=true`);
        if (postsRes.success && postsRes.data) {
          setUserPosts(postsRes.data.data || postsRes.data);
        }

        if (isOwnProfile) {
          // Fetch liked posts
          const likedRes = await api.get<{ data: Post[] }>('/posts/liked');
          if (likedRes.success && likedRes.data) {
            setLikedPosts(likedRes.data.data || likedRes.data);
          }

          // Fetch bookmarked posts
          const bookmarkRes = await api.get<{ data: Post[] }>('/posts/bookmarked');
          if (bookmarkRes.success && bookmarkRes.data) {
            setBookmarkedPosts(bookmarkRes.data.data || bookmarkRes.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, isOwnProfile]);

  const getTabContent = () => {
    const posts = activeTab === 'posts' ? userPosts :
                  activeTab === 'likes' ? likedPosts :
                  bookmarkedPosts;

    if (isLoading) {
      return (
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
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No {activeTab} yet
          </h3>
          <p className="text-muted-foreground">
            {activeTab === 'posts' && 'This user hasn\'t published any posts yet.'}
            {activeTab === 'likes' && 'No liked posts yet.'}
            {activeTab === 'bookmarks' && 'No bookmarked posts yet.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post, index) => (
          <div key={post._id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
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
    );
  };

  if (isLoading && !profileUser) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-muted-foreground mb-4">The profile you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar
              src={profileUser.avatar}
              alt={profileUser.name}
              fallback={profileUser.name.charAt(0)}
              size="xl"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">{profileUser.name}</h1>
                <Badge variant={profileUser.role === 'ADMIN' ? 'destructive' : 
                       profileUser.role === 'EDITOR' ? 'warning' : 'secondary'}>
                  {profileUser.role}
                </Badge>
              </div>
              {profileUser.bio && (
                <p className="text-muted-foreground mt-1 max-w-2xl">{profileUser.bio}</p>
              )}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Joined {format(new Date(profileUser.createdAt), 'MMMM yyyy')}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  {userPosts.length} posts
                </div>
              </div>
            </div>
            {isOwnProfile && (
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/profile/edit">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-1 border-b mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'posts'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Posts
                <Badge variant="secondary" className="ml-1">{userPosts.length}</Badge>
              </div>
            </button>
            {isOwnProfile && (
              <>
                <button
                  onClick={() => setActiveTab('likes')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors',
                    activeTab === 'likes'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Liked
                    <Badge variant="secondary" className="ml-1">{likedPosts.length}</Badge>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('bookmarks')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors',
                    activeTab === 'bookmarks'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Bookmarks
                    <Badge variant="secondary" className="ml-1">{bookmarkedPosts.length}</Badge>
                  </div>
                </button>
              </>
            )}
          </div>

          {/* Tab Content */}
          {getTabContent()}
        </div>
      </div>
    </div>
  );
}
