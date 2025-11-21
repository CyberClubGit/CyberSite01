
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

  if (serviceAccount) {
    console.log('[Admin SDK] Initializing with service account credentials.');
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return adminApp;
  }
  
  // Fallback for environments where default credentials are expected (like production Firebase Hosting)
  console.log('[Admin SDK] Initializing with default application credentials.');
  adminApp = admin.initializeApp();
  return adminApp;
}
