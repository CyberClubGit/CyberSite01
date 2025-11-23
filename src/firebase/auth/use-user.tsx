
'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useFirebaseAuth, useFirestore } from '@/firebase/provider';

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  emailVerified: boolean;
  favorites: string[];
  isAdmin: boolean;
}

const ADMIN_EMAIL = 'contact@cyber-club.net';

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  signOut: () => Promise<void>;
  toggleFavorite: (productId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(userDocRef, (userDoc) => {
          let additionalData: Partial<UserData> = {};
          if (userDoc.exists()) {
            additionalData = userDoc.data() as Partial<UserData>;
          }

          const userData: UserData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            isAdmin: firebaseUser.email === ADMIN_EMAIL,
            favorites: [],
            ...additionalData,
          };
          
          setUser(userData);
          setLoading(false);
        }, (error) => {
            console.error("Error listening to user document:", error);
            const userData: UserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified,
              isAdmin: firebaseUser.email === ADMIN_EMAIL,
              favorites: [],
            };
            setUser(userData);
            setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth, db]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const toggleFavorite = useCallback(async (productId: string) => {
    if (!user) {
        console.error("Cannot toggle favorite: User is not logged in.");
        return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const isCurrentlyFavorite = user.favorites.includes(productId);

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
        console.error("Error updating favorites in Firestore:", error);
    }
  }, [user, db]);

  return (
    <UserContext.Provider value={{ user, loading, signOut, toggleFavorite }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
