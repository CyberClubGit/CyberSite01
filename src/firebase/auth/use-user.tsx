
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { useFirebaseAuth } from '@/firebase/provider';

// This is the definitive UserData interface for the entire application.
// It now includes an optional nickname.
export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
  nickname?: string | null;
}

const ADMIN_EMAIL = 'contact@cyber-club.net';

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is the single source of truth for user authentication status.
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // If a user is logged in, create a clean UserData object
        // using ONLY data from the auth object.
        const userData: UserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          isAdmin: firebaseUser.email === ADMIN_EMAIL,
        };
        setUser(userData);
      } else {
        // If no user is logged in, set the user to null.
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup the listener on component unmount
    return () => unsubscribeAuth();
  }, [auth]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // setUser(null) will be handled by the onAuthStateChanged listener
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = { user, loading, signOut };

  return (
    <UserContext.Provider value={value}>
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
