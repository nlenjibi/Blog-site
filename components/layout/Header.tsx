'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sun, Moon, Tv, Menu, X, Search, User, LogOut, LayoutDashboard, BookOpen, PlusCircle, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export const Header = React.forwardRef<HTMLDivElement>(({}, ref) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/categories', label: 'Categories' },
    { href: '/about', label: 'About' },
  ];

  const adminNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart2 },
    { href: '/admin/posts', label: 'Manage Posts', icon: BookOpen },
  ];

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'black'> = ['light', 'dark', 'black'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    }
    logout();
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      ref={ref as any}
      className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Tv className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl hidden sm:inline-block">
                SmartInsight
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {!searchOpen ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => {
                    const searchInput = document.getElementById('search-input');
                    if (searchInput) (searchInput as HTMLInputElement).focus();
                  }, 100);
                }}
                aria-label="Open search"
              >
                <Search className="h-5 w-5" />
              </Button>
            ) : (
              <form onSubmit={handleSearch} className="relative w-full max-w-xs">
                <Input
                  id="search-input"
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' || (theme === 'light' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                ? theme === 'black'
                  ? <Sun className="h-5 w-5" />
                  : <Sun className="h-5 w-5" />
                : <Moon className="h-5 w-5" }
            </Button>

            {isAuthenticated ? (
              <>
                {/* Admin Menu for Admin Users */}
                {user?.role === 'ADMIN' || user?.role === 'EDITOR' ? (
                  <div className="hidden md:flex items-center">
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <BarChart2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <Link
                      href="/post/new"
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">New Post</span>
                    </Link>
                  </div>
                ) : user?.role === 'AUTHOR' ? (
                  <Link
                    href="/post/new"
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Write
                  </Link>
                ) : null}

                {/* User Menu - Desktop */}
                <div className="hidden md:flex items-center gap-2">
                  <Link href={`/profile/${user?._id}`}>
                    <Avatar
                      src={user?.avatar}
                      alt={user?.name}
                      fallback={user?.name?.charAt(0)}
                      size="sm"
                    />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden md:inline-flex"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild className="hidden md:inline-flex">
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              className="md:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300',
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          )}
        >
          <div className="py-4 border-t">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Admin Menu */}
            {(user?.role === 'ADMIN' || user?.role === 'EDITOR' || user?.role === 'AUTHOR') && (
              <div className="mt-4 pt-4 border-t">
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
                  Creator Tools
                </p>
                <nav className="flex flex-col gap-1 mt-1">
                  {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                    <>
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        <BarChart2 className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        href="/admin/posts"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        <BookOpen className="h-4 w-4" />
                        Manage Posts
                      </Link>
                    </>
                  )}
                  <Link
                    href="/post/new"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary/10 text-primary"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {user?.role === 'AUTHOR' ? 'Write Post' : 'New Post'}
                  </Link>
                </nav>
              </div>
            )}

            {/* Mobile Auth Menu */}
            {isAuthenticated ? (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar
                    src={user?.avatar}
                    alt={user?.name}
                    fallback={user?.name?.charAt(0)}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.role}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full mt-2 justify-start gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t flex flex-col gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
