
'use client';

import { initializeFirebaseApp } from './config';
import { FirebaseProvider, useFirebase, useFirebaseApp, useFirebaseAuth, useFirestore } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useUser } from './auth/use-user';
import { GoogleAuthProvider } from 'firebase/auth';

function initializeFirebase() {
    const app = initializeFirebaseApp();
    return app;
}

const useAuth = useUser;


export const googleProvider = new GoogleAuthProvider();


export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useFirebaseAuth, 
  useAuth,
};
