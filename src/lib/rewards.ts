"use client";

import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const MAX_WILDSAURA_POINTS = 250;

type RewardKind =
  | "first_login"
  | "daily_login"
  | "verification"
  | "referral_join"
  | "referral_verified";

export interface AwardResult {
  eventKey: string;
  points: number;
  title: string;
  message: string;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function safeEventId(userId: string, eventKey: string) {
  return `${userId}_${eventKey}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function awardPoints(
  userId: string,
  eventKey: string,
  points: number,
  kind: RewardKind,
  title: string,
  message: string
): Promise<AwardResult | null> {
  const txRef = doc(db, "pointTransactions", safeEventId(userId, eventKey));
  const userRef = doc(db, "users", userId);
  const notificationRef = doc(collection(db, "notifications"));

  return runTransaction(db, async (tx) => {
    const existing = await tx.get(txRef);
    if (existing.exists()) return null;

    const userSnap = await tx.get(userRef);
    const currentPoints = Number(userSnap.data()?.walletPoints || 0);
    const remaining = Math.max(0, MAX_WILDSAURA_POINTS - currentPoints);
    const awardedPoints = Math.min(points, remaining);
    if (awardedPoints <= 0) return null;

    const nextPoints = currentPoints + awardedPoints;

    tx.set(txRef, {
      userId,
      eventKey,
      type: kind,
      title,
      description: message,
      points: awardedPoints,
      balanceAfter: nextPoints,
      createdAt: serverTimestamp(),
    });

    tx.set(notificationRef, {
      userId,
      type: "points",
      title,
      message,
      points: awardedPoints,
      read: false,
      createdAt: serverTimestamp(),
    });

    tx.set(
      userRef,
      {
        walletPoints: nextPoints,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { eventKey, points: awardedPoints, title, message };
  });
}

async function dailyRewardCount(userId: string) {
  const snap = await getDocs(
    query(
      collection(db, "pointTransactions"),
      where("userId", "==", userId),
      where("type", "==", "daily_login"),
      limit(30)
    )
  );
  return snap.size;
}

export async function recordReferralJoin(newUser: User, referrerId: string) {
  if (!referrerId || referrerId === newUser.uid) return null;

  const newUserRef = doc(db, "users", newUser.uid);
  const referrerRef = doc(db, "users", referrerId);
  const referrerSnap = await getDoc(referrerRef);
  if (!referrerSnap.exists()) return null;

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(newUserRef);
    if (userSnap.data()?.referredBy) return;
    tx.set(
      newUserRef,
      {
        referredBy: referrerId,
        referredAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

  return awardPoints(
    referrerId,
    `referral-join-${newUser.uid}`,
    10,
    "referral_join",
    "Referral joined",
    `${newUser.displayName || newUser.email || "A new user"} joined using your referral.`
  );
}

export async function processLoginRewards(user: User): Promise<AwardResult[]> {
  const awards: AwardResult[] = [];
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const profile = userSnap.data() || {};
  const displayName = user.displayName || profile.displayName || "there";

  const firstLogin = await awardPoints(
    user.uid,
    "first-login",
    30,
    "first_login",
    "Welcome to WildSaura",
    `Hi ${displayName}, you earned your first login bonus.`
  );
  if (firstLogin) awards.push(firstLogin);

  const dailyCount = await dailyRewardCount(user.uid);
  if (dailyCount < 30) {
    const daily = await awardPoints(
      user.uid,
      `daily-login-${todayKey()}`,
      2,
      "daily_login",
      "Daily login reward",
      `You earned 2 points for today's login. ${29 - dailyCount} daily rewards left.`
    );
    if (daily) awards.push(daily);
  }

  const isVerified = Boolean(profile.isVerified || profile.verified);
  if (isVerified) {
    const verification = await awardPoints(
      user.uid,
      "verification-bonus",
      10,
      "verification",
      "Verification bonus",
      "Your WildSaura account is verified, so you earned bonus points."
    );
    if (verification) awards.push(verification);

    if (profile.referredBy) {
      const referrerVerification = await awardPoints(
        String(profile.referredBy),
        `referral-verified-${user.uid}`,
        5,
        "referral_verified",
        "Referral verified",
        `${displayName} completed verification from your referral.`
      );
      if (referrerVerification) awards.push(referrerVerification);
    }
  }

  return awards;
}
