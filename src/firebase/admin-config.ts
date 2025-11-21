
import * as admin from 'firebase-admin';

// This file is for server-side Firebase Admin SDK initialization.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

let adminApp: admin.app.App;

export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!;
    return adminApp;
  }

  if (!serviceAccount) {
    // This will happen in the Firebase Hosting environment where default credentials are used.
    console.log('[Admin SDK] Initializing with default application credentials.');
    adminApp = admin.initializeApp();
    return adminApp;
  }
  
  console.log('[Admin SDK] Initializing with service account credentials.');
  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // You might need to add your databaseURL if it's not automatically detected
    // databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  return adminApp;
}
