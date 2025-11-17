'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase/provider';

export function useUser() {
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged can return a user object on initialization,
    // so we can use that to set the user state.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // To avoid a flash of unauthenticated content, we can check for the
  // initial user from the auth object.
  useEffect(() => {
    if (auth.currentUser) {
      setUser(auth.currentUser);
      setLoading(false);
    }
  }, [auth.currentUser]);

  return { user, loading };
}
