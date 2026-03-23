import * as admin from "firebase-admin";

function ensureApp() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
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
