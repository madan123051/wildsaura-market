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
  apiKey: "AIzaSyCXDJrFmn-pzbqys91tj4Fruqn4tl58p9Y",
  authDomain: "wildsaura-1ef8a.firebaseapp.com",
  databaseURL: "https://wildsaura-1ef8a-default-rtdb.firebaseio.com",
  projectId: "wildsaura-1ef8a",
  storageBucket: "wildsaura-1ef8a.firebasestorage.app",
  messagingSenderId: "690017200836",
  appId: "1:690017200836:web:e2c24713868a943b6ff791",
  measurementId: "G-VM7GYYJMCC",
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
