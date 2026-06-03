"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { redirectToDrishyaVerify, MARKET_URL } from "@/lib/drishya";

/**
 * Guards a page behind `profile.isVerified`.
 *
 * Behaviour:
 *  1. Refreshes the user profile from Firestore once on mount so that any
 *     `isVerified` update written by Drishya is picked up immediately.
 *  2. After the refresh, if the profile is still unverified the user is
 *     redirected to the Drishya verification page with a `returnUrl`
 *     pointing back to `destinationPath` on this market site.
 *
 * @param destinationPath  The path on Market the user should return to,
 *                         e.g. "/upload" or "/equipment/sell".
 * @returns `{ isVerified, checking }` — render a spinner while `checking`
 *          is true so the real page content never flashes for unverified users.
 */
export function useVerificationGuard(destinationPath: string) {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [refreshed, setRefreshed] = useState(false);

  // Step 1 ── refresh profile once as soon as the auth state resolves.
  // This picks up any isVerified change Drishya may have written while
  // the user was away on the verification page.
  useEffect(() => {
    if (loading || !user || refreshed) return;
    refreshProfile().finally(() => setRefreshed(true));
    // `refreshProfile` is a stable useCallback; safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  // Step 2 ── after the refresh, redirect unverified users to Drishya.
  useEffect(() => {
    if (loading || !refreshed || !user) return;
    if (profile && !profile.isVerified) {
      redirectToDrishyaVerify(`${MARKET_URL}${destinationPath}`);
    }
  }, [loading, refreshed, user, profile, destinationPath]);

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
