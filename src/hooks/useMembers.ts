'use client';

import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, doc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, CurrentUser } from '@/types/community';

export function useMembers(currentUser: CurrentUser | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'community_members'), (snap) => {
      setMemberCount(snap.size);
      const list: Member[] = [];
      snap.forEach((d) => list.push({ userId: d.id, ...d.data() } as Member));
      list.sort((a, b) => {
        const ta = a.joinedAt?.toDate?.()?.getTime?.() || 0;
        const tb = b.joinedAt?.toDate?.()?.getTime?.() || 0;
        return tb - ta;
      });
      setMembers(list);
      if (currentUser) {
        setIsMember(snap.docs.some(d => d.id === currentUser.uid));
      }
    });
    return () => unsub();
  }, [currentUser]);

  const joinCommunity = async () => {
    if (!currentUser) return;
    setJoining(true);
    try {
      await setDoc(doc(db, 'community_members', currentUser.uid), {
        userId: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email || '',
        avatarUrl: currentUser.avatarUrl || currentUser.photoURL || '',
        avatarColor: currentUser.avatarColor || '#4ECDC4',
        spiritAnimal: currentUser.avatarAnimal || '',
        joinedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Join failed:', err);
    }
    setJoining(false);
  };

  const ensureMember = async () => {
    if (!isMember && currentUser) await joinCommunity();
  };

  return { members, memberCount, isMember, joining, joinCommunity, ensureMember };
}
