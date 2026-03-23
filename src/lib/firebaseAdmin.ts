import admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";

/**
 * Firebase Admin SDK — server-side only.
 * Used in API Routes for verifying tokens, writing to Firestore securely,
 * and managing Storage signed URLs.
 */

const serviceAccount: ServiceAccount = {
  projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
  // Newlines must be escaped in .env; restore them here
  privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminDb      = admin.firestore();
export const adminAuth    = admin.auth();
export const adminStorage = admin.storage();
export default admin;
