
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
                    // Les favoris sont stockés par ID de produit (qui est l'ID de document Firestore)
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

    const toggleFavorite = useCallback(async (productId: string) => {
        if (!userId) {
            console.error("Cannot toggle favorite: User is not logged in.");
            return;
        };

        const userDocRef = doc(db, 'users', userId);
        const isCurrentlyFavorite = favorites.includes(productId);

        // Optimistic UI update
        setFavorites(prevFavorites =>
            isCurrentlyFavorite
                ? prevFavorites.filter(id => id !== productId)
                : [...prevFavorites, productId]
        );

        try {
            if (isCurrentlyFavorite) {
                await updateDoc(userDocRef, {
                    favorites: arrayRemove(productId)
                });
            } else {
                await updateDoc(userDocRef, {
                    favorites: arrayUnion(productId)
                });
            }
        } catch (error) {
            console.error("Error updating favorites: This is likely a Firestore security rule issue.", error);
            // Revert optimistic update on error
            setFavorites(prevFavorites =>
                isCurrentlyFavorite
                    ? [...prevFavorites, productId]
                    : prevFavorites.filter(id => id !== productId)
            );
        }
    }, [userId, db, favorites]);

    return { favorites, toggleFavorite, loading };
}
