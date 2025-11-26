
"use client";

import React, { useState, useCallback, ReactNode } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { CartProvider } from '@/hooks/useCart';
import { UserProvider } from '@/firebase/auth/use-user';
import { FavoritesContext, type FavoriteItem } from '@/hooks/useFavorites';

// FavoritesProvider implementation moved here to avoid JSX in .ts file.
export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    setFavorites(prevFavorites => {
      const isAlreadyFavorite = prevFavorites.some(fav => fav.id === item.id);
      if (isAlreadyFavorite) {
        return prevFavorites.filter(fav => fav.id !== item.id);
      } else {
        return [...prevFavorites, item];
      }
    });
  }, []);

  const isFavorite = useCallback((id: string) => {
    return favorites.some(fav => fav.id === id);
  }, [favorites]);

  const value = {
    favorites,
    toggleFavorite,
    isFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};


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
          <FavoritesProvider>
            <CartProvider>
            {children}
            </CartProvider>
          </FavoritesProvider>
        </UserProvider>
      </ThemeProvider>
    </FirebaseClientProvider>
  );
}
