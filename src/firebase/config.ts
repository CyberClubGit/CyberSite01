import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBA3huxqk-P6eGT5daoYwj0DjMvhrXQPuk",
  authDomain: "studio-4815326968-e81ad.firebaseapp.com",
  projectId: "studio-4815326968-e81ad",
  storageBucket: "studio-4815326968-e81ad.appspot.com",
  messagingSenderId: "424398773344",
  appId: "1:424398773344:web:dd20f3bc66a93f9120b705"
};

let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

export const firebaseApp = app;

export function initializeFirebaseApp(): FirebaseApp {
  return firebaseApp;
}
