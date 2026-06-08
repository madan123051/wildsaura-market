"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export type SellerVerificationStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "rejected"
  | null;

/**
 * Guards a page behind seller verification status.
 *
 * Reads both `isVerified` (market's own field) and `verified` (written by
 * identity.wildsaura after admin approval) so the two apps stay in sync even
 * though they share the same Firestore project.
 *
 * Returns:
 *  - `isVerified`          true when the seller is fully approved
 *  - `verificationStatus`  granular status for UI differentiation
 *  - `checking`            true while auth / profile is loading
 */
export function useVerificationGuard(_destinationPath: string) {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [refreshed, setRefreshed] = useState(false);

  // Refresh profile once on mount so any `verified` update written by
  // identity.wildsaura (or the admin panel) is picked up immediately.
  useEffect(() => {
    if (loading || !user || refreshed) return;
    refreshProfile().finally(() => setRefreshed(true));
    // `refreshProfile` is stable; safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  // Cast through unknown first to satisfy TypeScript's overlap check.
  // Both `isVerified` (market) and `verified` (identity.wildsaura) are read
  // so the two apps stay in sync even though they share the same Firestore.
  const profileAny = profile as unknown as Record<string, unknown>;

  const isVerified = Boolean(
    profile?.isVerified || profileAny?.verified
  );

  // Read the granular status written by identity.wildsaura.
  const rawStatus = profileAny?.verificationStatus as string | undefined;

  // If the profile is loaded but has no verificationStatus field, treat it
  // as "not_started" so the sell-page useEffect redirect fires immediately.
  // Only return null while the profile is still loading (profile === null).
  const verificationStatus: SellerVerificationStatus = isVerified
    ? "verified"
    : (rawStatus as SellerVerificationStatus) || (profile ? "not_started" : null);

  return {
    /** True once the seller's identity is confirmed as verified. */
    isVerified,
    /** Granular status — use to show pending / rejected / not-started UI. */
    verificationStatus,
    /** True while auth is loading or the initial profile refresh is in flight. */
    checking: loading || (Boolean(user) && !refreshed),
  };
}
