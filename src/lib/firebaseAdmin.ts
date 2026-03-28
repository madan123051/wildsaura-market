import * as admin from "firebase-admin";

function ensureApp() {
  if (!admin.apps.length) {
    // Support both FIREBASE_* and FIREBASE_ADMIN_* env var names
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    const clientEmail =
      process.env.FIREBASE_CLIENT_EMAIL ||
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

    const privateKey = (
      process.env.FIREBASE_PRIVATE_KEY ||
      process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
      ""
    ).replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      console.error(
        "Firebase Admin init failed — missing env vars.",
        { projectId: !!projectId, clientEmail: !!clientEmail, privateKey: !!privateKey }
      );
      throw new Error(
        "Firebase Admin credentials not configured. Required: FIREBASE_PROJECT_ID (or FIREBASE_ADMIN_PROJECT_ID), FIREBASE_CLIENT_EMAIL (or FIREBASE_ADMIN_CLIENT_EMAIL), FIREBASE_PRIVATE_KEY (or FIREBASE_ADMIN_PRIVATE_KEY)"
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
}

// Lazy getters — only init Firebase when actually called at runtime
export const adminAuth = {
  verifyIdToken: (...args: Parameters<admin.auth.Auth["verifyIdToken"]>) => {
    ensureApp();
    return admin.auth().verifyIdToken(...args);
  },
} as admin.auth.Auth;

export const adminDb = {
  collection: (...args: Parameters<admin.firestore.Firestore["collection"]>) => {
    ensureApp();
    return admin.firestore().collection(...args);
  },
} as admin.firestore.Firestore;

export default admin;
