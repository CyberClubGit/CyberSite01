
import * as admin from 'firebase-admin';

// This function safely initializes the Firebase Admin SDK.
// It ensures that it only initializes once (singleton pattern).
export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  // The environment in Firebase Studio automatically provides the necessary
  // service account credentials. We don't need to manually manage keys.
  try {
    const app = admin.initializeApp();
    console.log('[Admin SDK] Initialized successfully using default credentials.');
    return app;
  } catch (error) {
    console.error('[Admin SDK] CRITICAL: Initialization failed.', error);
    return null;
  }
}
