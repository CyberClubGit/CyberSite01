
'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export function useFavorites(userId: string | undefined) {
    const db = useFirestore();
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setFavorites([]);
            setLoading(false);
            return;
        }

        const fetchFavorites = async () => {
            setLoading(true);
            try {
                const userDocRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setFavorites(userDoc.data().favorites || []);
                }
            } catch (error) {
                console.error("Error fetching favorites: This is likely a Firestore security rule issue.", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [userId, db]);

    const toggleFavorite = useCallback(async (itemId: string) => {
        if (!userId) {
            console.error("Cannot toggle favorite: User is not logged in.");
            return;
        };

        const userDocRef = doc(db, 'users', userId);
        const isCurrentlyFavorite = favorites.includes(itemId);

        // Optimistic UI update
        setFavorites(prevFavorites =>
            isCurrentlyFavorite
                ? prevFavorites.filter(id => id !== itemId)
                : [...prevFavorites, itemId]
        );

        try {
            if (isCurrentlyFavorite) {
                await updateDoc(userDocRef, {
                    favorites: arrayRemove(itemId)
                });
            } else {
                await updateDoc(userDocRef, {
                    favorites: arrayUnion(itemId)
                });
            }
        } catch (error) {
            console.error("Error updating favorites: This is likely a Firestore security rule issue.", error);
            // Revert optimistic update on error
            setFavorites(prevFavorites =>
                isCurrentlyFavorite
                    ? [...prevFavorites, itemId]
                    : prevFavorites.filter(id => id !== itemId)
            );
        }
    }, [userId, db, favorites]);

    return { favorites, toggleFavorite, loading };
}
