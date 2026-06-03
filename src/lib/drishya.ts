import { DRISHYA_APP_URL } from "@/types";

/** The public URL of WildSaura Market (used to build returnUrl parameters). */
export const MARKET_URL =
  process.env.NEXT_PUBLIC_MARKET_URL || "https://market.wildsaura.com";

/** Opens the main Drishya app in a new tab. */
export function openDrishya() {
  window.open(DRISHYA_APP_URL, "_blank", "noopener,noreferrer");
}

/**
 * Redirects the current window to the Drishya verification page.
 * After the user completes verification Drishya will set
 * `users/{uid}.isVerified = true` in Firestore and redirect
 * the browser back to `returnUrl`.
 */
export function redirectToDrishyaVerify(returnUrl: string) {
  const verifyUrl = new URL(`${DRISHYA_APP_URL}/verify`);
  verifyUrl.searchParams.set("returnUrl", returnUrl);
  window.location.href = verifyUrl.toString();
}
