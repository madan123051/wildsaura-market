"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { processLoginRewards } from "@/lib/rewards";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function RewardsInitializer() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading || !user || !profile) return;

    const greetingKey = `wildsaura_greeting_${user.uid}_${todayKey()}`;
    if (sessionStorage.getItem(greetingKey) !== "1") {
      sessionStorage.setItem(greetingKey, "1");
      toast.success(`Welcome back${profile.displayName ? `, ${profile.displayName}` : ""}!`);
    }

    const rewardsKey = `wildsaura_rewards_${user.uid}_${todayKey()}`;
    if (sessionStorage.getItem(rewardsKey) === "1") return;
    sessionStorage.setItem(rewardsKey, "1");

    processLoginRewards(user)
      .then((awards) => {
        awards.forEach((award) => {
          toast.success(`+${award.points} points: ${award.title}`);
        });
      })
      .catch((error) => {
        console.warn("Reward check failed", error);
      });
  }, [user, profile, loading]);

  return null;
}
