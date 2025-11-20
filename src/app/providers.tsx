
"use client";

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import type { Category, Brand } from '@/lib/sheets';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

interface ProvidersProps {
  children: React.ReactNode;
  categories: Category[];
  brands: Brand[];
}

export function Providers({ children, categories, brands }: ProvidersProps) {
  return (
    <FirebaseClientProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="flex min-h-screen flex-col text-foreground bg-transparent">
          <Header categories={categories} brands={brands} />
          <main className="flex-1">{children}</main>
          <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
            <p className="text-xs text-muted-foreground">
              &copy; 2024 CYBER CLUB. All rights reserved.
            </p>
            <div className="sm:ml-auto">
              <ThemeToggleButton />
            </div>
          </footer>
        </div>
      </ThemeProvider>
    </FirebaseClientProvider>
  );
}
