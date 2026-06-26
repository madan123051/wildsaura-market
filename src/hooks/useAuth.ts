"use client";

import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  User,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, getDocFromServer, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";
import type { UserProfile } from "@/types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  loginWithEmail: (email: string, password: string) => Promise<User>;
  signupWithEmail: (name: string, email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const googleProvider = new GoogleAuthProvider();

export function useAuth(): AuthState & AuthActions {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Always read directly from the Firestore server to bypass the SDK's
  // in-memory cache.  This is critical for the verification guard: a user
  // returning from identity.wildsaura.com must see the latest
  // verified / isVerified values, not a stale cached copy.
  // Cache-first fetch — used in onAuthStateChanged so the initial page load
  // never hangs waiting for a live server round-trip.
  const fetchProfile = useCallback(async (uid: string) => {
    const ref  = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setProfile(snap.data() as UserProfile);
    }
  }, []);

  // Server-only fetch — used by refreshProfile so the verification guard
  // always reads the latest value written by identity.wildsaura.
  const fetchProfileFromServer = useCallback(async (uid: string) => {
    const ref  = doc(db, "users", uid);
    const snap = await getDocFromServer(ref);
    if (snap.exists()) {
      setProfile(snap.data() as UserProfile);
    }
  }, []);

  const createUserProfile = useCallback(async (
    uid: string,
    displayName: string,
    email: string,
    avatarUrl?: string
  ) => {
    const ref = doc(db, "users", uid);
    // Use getDocFromServer so a freshly-verified profile is never missed.
    const snap = await getDocFromServer(ref);
    if (!snap.exists()) {
      const newProfile: Omit<UserProfile, "createdAt"> & { createdAt: unknown } = {
        uid,
        displayName,
        email,
        avatarUrl: avatarUrl ?? "",
        isVerified: false,
        walletPoints: 0,
        role: "creator",
        createdAt: serverTimestamp(),
      };
      await setDoc(ref, newProfile);
      setProfile(newProfile as UserProfile);
    } else {
      setProfile(snap.data() as UserProfile);
    }
  }, []);

  // Handle redirect result on page load (for signInWithRedirect fallback)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const u = result.user;
          await createUserProfile(
            u.uid,
            u.displayName ?? "User",
            u.email ?? "",
            u.photoURL ?? ""
          );
        }
      })
      .catch((err) => {
        console.error("Redirect sign-in error:", err);
        setError(err.message);
      });
  }, [createUserProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setSessionCookie(firebaseUser.uid);
        await fetchProfile(firebaseUser.uid);
      } else {
        clearSessionCookie();
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchProfile]);

  const loginWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    } catch (err: unknown) {
      setError((err as Error).message);
      throw err;
    }
  };

  const signupWithEmail = async (name: string, email: string, password: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await createUserProfile(cred.user.uid, name, email);
      return cred.user;
    } catch (err: unknown) {
      setError((err as Error).message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      // Try popup first (works on desktop)
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      await createUserProfile(u.uid, u.displayName ?? "User", u.email ?? "", u.photoURL ?? "");
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      const errorCode = firebaseError.code || "unknown";
      const errorMsg = firebaseError.message || "Unknown error";
      
      console.error("Google popup sign-in failed:", errorCode, errorMsg);
      
      // For these errors, try redirect as fallback
      const redirectableCodes = [
        "auth/popup-blocked",
        "auth/popup-closed-by-user",
        "auth/cancelled-popup-request",
        "auth/internal-error",
        "auth/network-request-failed",
      ];
      
      if (redirectableCodes.includes(errorCode)) {
        try {
          console.log("Trying signInWithRedirect fallback...");
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: unknown) {
          const rErr = redirectErr as { code?: string; message?: string };
          setError(`Redirect also failed [${rErr.code}]: ${rErr.message}`);
          throw redirectErr;
        }
      }
      
      // Show detailed error for debugging
      setError(`Google login failed [${errorCode}]: ${errorMsg}`);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    clearSessionCookie();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfileFromServer(user.uid);
  };

  return { user, profile, loading, error, loginWithEmail, signupWithEmail, loginWithGoogle, logout, refreshProfile };
}
