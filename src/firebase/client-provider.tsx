"use client";

import { initializeFirebase } from "@/firebase/index";
import { FirebaseProvider }from "@/firebase/provider";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { ReactNode, useMemo } from "react";

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const { firebaseApp, firestore, auth } = useMemo(() => {
    const app = initializeFirebase();
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
