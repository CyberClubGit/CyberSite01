
// This file is no longer used for data fetching in the Next.js app
// but is kept for potential future server-side admin tasks.
// The data fetching has been moved to the client-side to resolve
// authentication issues in the development environment.

import * as admin from 'firebase-admin';

export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // In a real production environment, you would use service account credentials
  // or Application Default Credentials. For this app, we are moving data
  // fetching to the client, so this server-side initialization is not critical
  // for the catalog page anymore.
  console.log('[Admin SDK] Initialization skipped. Data fetching is client-side.');
  
  return null; // Return null or a mock object if needed
}
