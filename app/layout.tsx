import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/Toast';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/components/auth/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'SmartInsight AI Blog',
    template: '%s | SmartInsight AI Blog',
  },
  description: 'AI-powered blogging platform for IoT, Energy, Food, Healthcare, and Technology',
  keywords: ['AI blog', 'technology', 'IoT', 'energy', 'healthcare', 'smart insights'],
  authors: [{ name: 'SmartInsight Team' }],
  creator: 'SmartInsight',
  publisher: 'SmartInsight',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://smartinsight.ai',
    siteName: 'SmartInsight AI Blog',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
            storageKey="smartinsight-theme"
            themes={['light', 'dark', 'black']}
          >
            <div className="flex min-h-screen flex-col bg-background text-foreground">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
