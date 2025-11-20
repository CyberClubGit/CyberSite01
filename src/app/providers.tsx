
"use client";

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import type { Category, Brand } from '@/lib/sheets';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { RefreshButton } from '@/components/refresh-button';

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
          {/* Footer reconstruit pour être simple et au premier plan */}
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
      </ThemeProvider>
    </FirebaseClientProvider>
  );
}
