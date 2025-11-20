import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { getBrands, getCategories } from '@/lib/sheets';
import { Providers } from './providers';
import type { Metadata } from 'next';
import { RefreshButton } from '@/components/refresh-button';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'CYBER CLUB',
  description: 'CYBER CLUB website',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();
  const brands = await getBrands();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Kode+Mono:wght@400..700&family=Orbitron:wght@400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col text-foreground bg-transparent">
            <Header categories={categories} brands={brands} />
            <main className="flex-1">{children}</main>
            <footer className="relative z-20 flex w-full shrink-0 items-center gap-2 border-t px-4 py-4 md:px-6">
              <p className="text-xs text-muted-foreground">
                &copy; 2024 CYBER CLUB. All rights reserved.
              </p>
              <div className="ml-auto flex items-center gap-2">
                <RefreshButton />
                <ThemeToggleButton />
              </div>
            </footer>
          </div>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
