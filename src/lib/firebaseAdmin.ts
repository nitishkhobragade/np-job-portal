import * as admin from 'firebase-admin';

/**
 * Initializes and returns Firebase Admin SDK instance safely.
 * Handles both production service account credentials and fallback project ID.
 */
export function getFirebaseAdminApp(): admin.app.App | null {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'np-job-portal';

  // 1. If explicit service account JSON is provided in env
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey);
      return admin.initializeApp({
        credential: admin.credential.cert(parsed),
        projectId
      });
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    }
  }

  // 2. Try default application credentials
  try {
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId
    });
  } catch (appDefErr) {
    console.info('Application default credentials not available, trying project ID init:', appDefErr);
  }

  // 3. Project ID only fallback (works for certain GCP runtime environments)
  try {
    return admin.initializeApp({
      projectId
    });
  } catch (projErr) {
    console.warn('Firebase Admin project init notice:', projErr);
    return null;
  }
}
