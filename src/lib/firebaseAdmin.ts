import * as admin from "firebase-admin";

/**
 * Robustly parse Firebase private key from environment variable.
 * Handles common Vercel/hosting formatting issues:
 * - Keys wrapped in double or single quotes
 * - JSON-encoded strings (escaped quotes)
 * - Literal \n vs real newlines
 */
function parsePrivateKey(raw: string): string {
  if (!raw) return "";

  let key = raw.trim();

  // 1. If it looks like a JSON string (starts & ends with quotes), try JSON.parse
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    try {
      // JSON.parse handles \n → real newline automatically
      key = JSON.parse(key);
    } catch {
      // Remove quotes manually if JSON.parse fails
      key = key.slice(1, -1);
    }
  }

  // 2. Replace literal \n (two chars: backslash + n) with real newlines
  key = key.replace(/\\n/g, "\n");

  // 3. Debug: Verify it looks like a PEM key
  if (!key.includes("-----BEGIN")) {
    console.error(
      "[Firebase Admin] Private key does not contain PEM header.",
      "First 30 chars:",
      JSON.stringify(key.substring(0, 30)),
      "Length:",
      key.length
    );
  }

  return key;
}

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

    const rawKey =
      process.env.FIREBASE_PRIVATE_KEY ||
      process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
      "";

    const privateKey = parsePrivateKey(rawKey);

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
