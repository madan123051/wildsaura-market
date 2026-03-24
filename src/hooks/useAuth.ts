"use client";

import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, password: string) => Promise<void>;
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

  const fetchProfile = useCallback(async (uid: string) => {
    const ref  = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setProfile(snap.data() as UserProfile);
    }
  }, []);

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

  const createUserProfile = async (
    uid: string,
    displayName: string,
    email: string,
    avatarUrl?: string
  ) => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
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
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
    } catch (err: unknown) {
      setError((err as Error).message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      await createUserProfile(u.uid, u.displayName ?? "User", u.email ?? "", u.photoURL ?? "");
    } catch (err: unknown) {
      setError((err as Error).message);
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
    if (user) await fetchProfile(user.uid);
  };

  return { user, profile, loading, error, loginWithEmail, signupWithEmail, loginWithGoogle, logout, refreshProfile };
}
