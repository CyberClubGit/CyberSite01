
import * as admin from 'firebase-admin';

// This file is for server-side Firebase Admin SDK initialization.

let adminApp: admin.app.App;

export function initializeAdminApp() {
  // If the app is already initialized, return it to prevent errors.
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      'CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Admin SDK cannot be initialized.'
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    console.log('[Admin SDK] Initializing with service account credentials.');
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return adminApp;
  } catch (error) {
    console.error('[Admin SDK] Failed to parse service account key.', error);
    throw new Error('Failed to initialize Firebase Admin SDK. The service account key may be malformed.');
  }
}
