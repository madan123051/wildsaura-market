'use client';

import { useState, useEffect } from 'react';
import {
  collection, addDoc, onSnapshot, orderBy, query,
  doc, updateDoc, deleteDoc, serverTimestamp, arrayUnion, arrayRemove, getDoc,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { compressImage } from '@/lib/utils';
import type { Post, CommentItem, CurrentUser } from '@/types/community';

export function usePosts(currentUser: CurrentUser | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'community_posts'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const fetched: Post[] = [];
      snap.forEach((d) => fetched.push({ id: d.id, ...d.data() } as Post));
      setPosts(fetched);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const uploadImage = async (file: File, uid: string): Promise<string | null> => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const compressed = await compressImage(file);
        const sRef = storageRef(storage, `community_posts/${uid}/${Date.now()}_post.jpg`);
        const snapshot = await uploadBytes(sRef, compressed);
        return await getDownloadURL(snapshot.ref);
      } catch (err) {
        if (attempt === 2) return null;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    return null;
  };

  const createPost = async (
    text: string,
    category: string,
    story: string,
    imageFile: File | null,
  ): Promise<{ success: boolean; error?: string; imageUploaded?: boolean }> => {
    if (!currentUser) return { success: false, error: 'Not logged in' };

    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile, currentUser.uid);
    }

    await addDoc(collection(db, 'community_posts'), {
      userId: currentUser.uid,
      username: currentUser.displayName,
      text: text.trim(),
      imageUrl,
      category: category || '',
      story: story.trim() || '',
      timestamp: serverTimestamp(),
      likes: [],
      comments: [],
      avatarUrl: currentUser.avatarUrl || currentUser.photoURL || '',
      avatarColor: currentUser.avatarColor || '#4ECDC4',
      spiritAnimal: currentUser.avatarAnimal || '',
    });

    return { success: true, imageUploaded: !!imageUrl };
  };

  const updatePost = async (
    postId: string,
    text: string,
    category: string,
    story: string,
    imageFile: File | null,
    existingImageUrl: string | null,
  ) => {
    if (!currentUser) return { success: false, error: 'Not logged in' };
    let imageUrl = existingImageUrl;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile, currentUser.uid);
      if (uploaded) imageUrl = uploaded;
    }
    await updateDoc(doc(db, 'community_posts', postId), {
      text: text.trim(),
      imageUrl,
      category: category || '',
      story: story.trim() || '',
    });
    return { success: true };
  };

  const deletePost = async (postId: string) => {
    await deleteDoc(doc(db, 'community_posts', postId));
  };

  const toggleLike = async (postId: string, likes: string[]) => {
    if (!currentUser) return;
    const postRef = doc(db, 'community_posts', postId);
    if (likes.includes(currentUser.uid)) {
      await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const postRef = doc(db, 'community_posts', postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) return;
    const existing: CommentItem[] = snap.data().comments || [];
    const newComment: CommentItem = {
      userId: currentUser.uid,
      username: currentUser.displayName,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      avatarUrl: currentUser.avatarUrl || currentUser.photoURL || '',
      avatarColor: currentUser.avatarColor || '#4ECDC4',
      spiritAnimal: currentUser.avatarAnimal || '',
    };
    await updateDoc(postRef, { comments: [...existing, newComment] });
  };

  return { posts, loading, createPost, updatePost, deletePost, toggleLike, addComment };
}
