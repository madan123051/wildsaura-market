'use client';

import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage, googleProvider, facebookProvider, appleProvider } from '@/lib/firebase';
import type { CurrentUser } from '@/types/community';

export function useAuth() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const mapUser = (fbUser: User): CurrentUser => ({
    uid: fbUser.uid,
    displayName: fbUser.displayName || 'WildSaura User',
    email: fbUser.email || undefined,
    avatarUrl: fbUser.photoURL || undefined,
    avatarColor: '#4ECDC4',
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setUser(fbUser ? mapUser(fbUser) : null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
  const loginWithFacebook = () => signInWithPopup(auth, facebookProvider);
  const loginWithApple = () => signInWithPopup(auth, appleProvider);
  const logout = () => signOut(auth);

  const updateUserProfile = async (newName: string, photoFile: File | null) => {
    if (!firebaseUser) return;
    let photoURL = firebaseUser.photoURL || undefined;
    if (photoFile) {
      const storageRef = ref(storage, `avatars/${firebaseUser.uid}/${Date.now()}_${photoFile.name}`);
      await uploadBytes(storageRef, photoFile);
      photoURL = await getDownloadURL(storageRef);
    }
    await updateProfile(firebaseUser, {
      displayName: newName || firebaseUser.displayName,
      photoURL: photoURL || null,
    });
    // Reload to get latest data
    await firebaseUser.reload();
    const refreshed = auth.currentUser;
    if (refreshed) setUser(mapUser(refreshed));
  };

  return { user, firebaseUser, loading, loginWithGoogle, loginWithFacebook, loginWithApple, logout, updateUserProfile };
}
