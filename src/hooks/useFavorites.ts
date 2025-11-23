
'use client';

import { useUser } from '@/firebase/auth/use-user';

/**
 * Provides access to the current user's favorites list and a function to toggle favorites.
 * This hook is a simple consumer of the central `useUser` hook.
 */
export function useFavorites() {
    const { user, loading, toggleFavorite } = useUser();

    return {
        // The list of favorite product IDs. Returns an empty array if not logged in.
        favorites: user?.favorites || [],
        
        // A function to add/remove a product ID from the favorites.
        toggleFavorite,
        
        // A boolean indicating if the initial user and favorites data is being loaded.
        loading,
    };
}
