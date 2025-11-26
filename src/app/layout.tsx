

import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { getBrands, getCategories } from '@/lib/sheets';
import { Providers } from './providers';
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { cn } from '@/lib/utils';

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
          <div className="flex flex-col min-h-screen text-foreground bg-transparent">
            <Header categories={categories} brands={brands} />
            <main className="flex-grow pb-24 md:pb-0">{children}</main>
            <Footer className="hidden md:block graph-view-active:hidden" />
          </div>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}

    