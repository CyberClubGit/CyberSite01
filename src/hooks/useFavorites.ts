
'use client';

import React, { createContext, useContext } from 'react';

// Use a clear interface for the favorite item
export interface FavoriteItem {
  id: string;
  title: string;
  displayImageUrl: string | null;
  [key: string]: any;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (id: string) => boolean;
}

// Create the context with a default undefined value
export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// The hook to consume the context
export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
