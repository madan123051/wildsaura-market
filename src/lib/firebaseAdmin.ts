import * as admin from "firebase-admin";

/**
 * Strip wrapping quotes from any env var value.
 */
function cleanEnvValue(raw: string | undefined): string {
  if (!raw) return "";
  let val = raw.trim();
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
  return val.trim();
}

/**
 * Robustly parse Firebase private key from environment variable.
 */
function parsePrivateKey(raw: string): string {
  if (!raw) return "";
  let key = raw.trim();

  // If it looks like a JSON string, try JSON.parse
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    try {
      key = JSON.parse(key);
    } catch {
      key = key.slice(1, -1);
    }
  }

  // Try again if still double-encoded
  if (key.startsWith('"') || key.startsWith("'")) {
    try { key = JSON.parse(key); } catch { /* ignore */ }
  }

  // Replace literal \\n with real newlines
  key = key.replace(/\\n/g, "\n");

  if (!key.includes("-----BEGIN")) {
    console.error("[Firebase Admin] Private key missing PEM header. First 30 chars:", JSON.stringify(key.substring(0, 30)));
  }

  return key;
}

/**
 * Try to get credentials from FIREBASE_SERVICE_ACCOUNT_JSON first (simplest),
 * then fall back to individual env vars.
 */
function getCredentials(): { projectId: string; clientEmail: string; privateKey: string } {
  // ========== METHOD 1: Single JSON env var (RECOMMENDED) ==========
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonRaw) {
    try {
      let jsonStr = jsonRaw.trim();
      // Handle if wrapped in single quotes
      if (jsonStr.startsWith("'") && jsonStr.endsWith("'")) {
        jsonStr = jsonStr.slice(1, -1);
      }
      const parsed = JSON.parse(jsonStr);
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        console.log("[Firebase Admin] Using FIREBASE_SERVICE_ACCOUNT_JSON");
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key,
        };
      }
    } catch (e) {
      console.error("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e);
    }
  }

  // ========== METHOD 2: Individual env vars (fallback) ==========
  const projectId = cleanEnvValue(
    process.env.FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );

  const clientEmail = cleanEnvValue(
    process.env.FIREBASE_CLIENT_EMAIL ||
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  );

  const rawKey = cleanEnvValue(
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );

  const privateKey = parsePrivateKey(rawKey);

  return { projectId, clientEmail, privateKey };
}

function ensureApp() {
  if (!admin.apps.length) {
    const { projectId, clientEmail, privateKey } = getCredentials();

    if (!projectId || !clientEmail || !privateKey) {
      console.error(
        "Firebase Admin init failed — missing credentials.",
        { projectId: !!projectId, clientEmail: !!clientEmail, privateKey: !!privateKey }
      );
      throw new Error(
        "Firebase Admin credentials not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or individual FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars."
      );
    }

    console.log(`[Firebase Admin] Initializing with project: ${projectId}, email: ${clientEmail.substring(0, 10)}...`);

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
  runTransaction: (...args: Parameters<admin.firestore.Firestore["runTransaction"]>) => {
    ensureApp();
    return admin.firestore().runTransaction(...args);
  },
} as admin.firestore.Firestore;

export default admin;
