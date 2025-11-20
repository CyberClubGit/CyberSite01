'use client';

import { initializeFirebaseApp } from './config';
import { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useUser } from './auth/use-user';
import { GoogleAuthProvider } from 'firebase/auth';


function initializeFirebase() {
    const app = initializeFirebaseApp();
    return app;
}

export const googleProvider = new GoogleAuthProvider();


export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useUser,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
};
