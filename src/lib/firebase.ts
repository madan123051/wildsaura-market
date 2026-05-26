"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth, Auth,
  GoogleAuthProvider, FacebookAuthProvider, OAuthProvider,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Prevent duplicate initializations in Next.js HMR / SSR
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth: Auth               = getAuth(app);
export const db: Firestore            = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const rtdb: Database           = getDatabase(app);

export const googleProvider   = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const appleProvider    = new OAuthProvider('apple.com');

export default app;
