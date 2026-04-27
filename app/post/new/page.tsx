"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function NewPostPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock categories - in real app, fetch from API
  const categories = [
    { _id: 'iot', name: 'IoT & Smart Systems', slug: 'iot' },
    { _id: 'energy', name: 'Energy & Sustainability', slug: 'energy' },
    { _id: 'food', name: 'Food & AgriTech', slug: 'food' },
    { _id: 'healthcare', name: 'Healthcare & Smart Hospitals', slug: 'healthcare' },
    { _id: 'tech', name: 'General Technology', slug: 'technology' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }

    if (!title.trim() || !content.trim() || !category) {
      setError('Title, content, and category are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const postData = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        featured,
        published,
        author: user._id,
        readingTime: Math.ceil(content.trim().split(' ').length / 200),
      };

      const response = await api.post('/posts', postData);

      if (response.success && response.data) {
        router.push(`/post/${response.data.slug}`);
      } else {
        setError(response.message || 'Failed to create post');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the post');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <CardTitle className="mb-4">Please Login</CardTitle>
            <CardDescription className="mb-6">
              You need to be logged in to create a post.
            </CardDescription>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/" className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Articles
              </Link>
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold">New Post</h1>
            <p className="text-muted-foreground mt-2">
              Create and share your content with the community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="text-sm font-medium mb-2 block">
                    Title *
                  </label>
                  <Input
                    id="title"
                    placeholder="Enter post title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={isLoading}
                    className="text-lg font-semibold"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label htmlFor="excerpt" className="text-sm font-medium mb-2 block">
                    Excerpt
                  </label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief description of your post..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    disabled={isLoading}
                    rows={3}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Category *
                  </label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="text-sm font-medium mb-2 block">
                    Tags
                  </label>
                  <Input
                    id="tags"
                    placeholder="Separate tags with commas (e.g., AI, technology, innovation)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {/* Content */}
                <div>
                  <label htmlFor="content" className="text-sm font-medium mb-2 block">
                    Content *
                  </label>
                  <Textarea
                    id="content"
                    placeholder="Write your post content here...\n\nYou can use Markdown formatting:\n# Heading 1\n## Heading 2\n**bold** text\n*italic* text\n\n- List item 1\n- List item 2\n\n[Link text](https://example.com)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isLoading}
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {content.trim().split('\n').length} lines, {content.length} characters
                    {content.trim() && (
                      <span>,
                        estimated reading time: {Math.ceil(content.trim().split(' ').length / 200)} min
                      </span>
                    )}
                  </p>
                </div>

                {/* Options */}
                <div className="flex items-center gap-6 pt-4 border-t">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      disabled={isLoading}
                      className="rounded border-input bg-background"
                    />
                    <span className="text-sm">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      disabled={isLoading}
                      className="rounded border-input bg-background"
                    />
                    <span className="text-sm">Publish immediately</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading} className="px-8">
                {isLoading ? 'Creating...' : (published ? 'Publish' : 'Save Draft')}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Cancel</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
