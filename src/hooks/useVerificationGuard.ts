"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

/**
 * Guards a page behind `profile.isVerified`.
 *
 * Behaviour:
 *  1. Refreshes the user profile from Firestore once on mount so that any
 *     `isVerified` update written externally is picked up immediately.
 *  2. Returns `{ isVerified, checking }` — the consuming page is responsible
 *     for rendering appropriate UI when `isVerified` is false.
 *     No automatic external redirects are performed.
 *
 * @param _destinationPath  Kept for API compatibility (no longer used for redirect).
 * @returns `{ isVerified, checking }` — render a spinner while `checking` is true.
 */
export function useVerificationGuard(_destinationPath: string) {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [refreshed, setRefreshed] = useState(false);

  // Refresh profile once as soon as auth state resolves to pick up any
  // isVerified changes that may have been written while the user was away.
  useEffect(() => {
    if (loading || !user || refreshed) return;
    refreshProfile().finally(() => setRefreshed(true));
    // `refreshProfile` is a stable useCallback; safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  return {
    /** `true` once profile is refreshed and `isVerified` is confirmed. */
    isVerified: Boolean(profile?.isVerified),
    /**
     * `true` while auth is loading OR while the initial profile refresh
     * is in progress. Render a loading indicator during this time.
     */
    checking: loading || (Boolean(user) && !refreshed),
  };
}
