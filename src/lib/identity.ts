/**
 * identity.ts — Cross-app helper for WildSaura Identity service.
 *
 * identity.wildsaura.com is the single sign-on & KYC hub for the WildSaura
 * ecosystem. This module provides utilities for redirecting users there
 * and returning them to the correct destination afterwards.
 */

/** Base URL of the WildSaura Identity app. */
export const IDENTITY_APP_URL =
  process.env.NEXT_PUBLIC_IDENTITY_APP_URL || "https://identity.wildsaura.com";

/** Public URL of this app (used to build the return URL). */
export const MARKET_URL =
  process.env.NEXT_PUBLIC_MARKET_URL || "https://market.wildsaura.com";

/**
 * Redirects the user to identity.wildsaura.com/verify.
 *
 * After the user completes (or re-submits) their verification on Identity,
 * they are sent back to `returnUrl` via the `?return=` query parameter.
 *
 * @param returnPath  Absolute URL or path on market.wildsaura.com to return to.
 *                    Defaults to the upload page.
 */
export function redirectToIdentityVerify(
  returnPath: string = `${MARKET_URL}/upload`
): void {
  const verifyUrl = new URL(`${IDENTITY_APP_URL}/verify`);
  verifyUrl.searchParams.set("return", returnPath);
  window.location.href = verifyUrl.toString();
}

/**
 * Builds the identity verify URL without navigating — useful for <a href>.
 */
export function buildIdentityVerifyUrl(
  returnPath: string = `${MARKET_URL}/upload`
): string {
  const verifyUrl = new URL(`${IDENTITY_APP_URL}/verify`);
  verifyUrl.searchParams.set("return", returnPath);
  return verifyUrl.toString();
}
