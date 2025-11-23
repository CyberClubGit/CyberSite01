
"use client";

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { CartProvider } from '@/hooks/useCart';
import { UserProvider } from '@/firebase/auth/use-user';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <FirebaseClientProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <UserProvider>
            <CartProvider>
            {children}
            </CartProvider>
        </UserProvider>
      </ThemeProvider>
    </FirebaseClientProvider>
  );
}
