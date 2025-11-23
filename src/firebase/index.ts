
'use client';

import { initializeFirebaseApp } from './config';
import { FirebaseProvider, useFirebase, useFirebaseApp, useAuth as useFirebaseAuth, useFirestore } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useUser } from './auth/use-user';
import { GoogleAuthProvider } from 'firebase/auth';

function initializeFirebase() {
    const app = initializeFirebaseApp();
    return app;
}

// The custom hook that includes Firestore data.
const useAuth = useUser;


export const googleProvider = new GoogleAuthProvider();


export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  // The hook that gives access to the raw firebase auth object
  useFirebaseAuth, 
  // The hook that gives access to user data from auth and firestore
  useAuth,
};
