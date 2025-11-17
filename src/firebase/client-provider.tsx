"use client";

import { initializeFirebaseApp } from "@/firebase/config";
import { FirebaseProvider }from "@/firebase/provider";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { ReactNode, useMemo } from "react";

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const { firebaseApp, firestore, auth } = useMemo(() => {
    const app = initializeFirebaseApp();
    return {
      firebaseApp: app,
      firestore: getFirestore(app),
      auth: getAuth(app),
    };
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
    </FirebaseProvider>
  );
}
