"use client";

/**
 * Lightweight session cookie helpers.
 * The cookie is checked by Next.js middleware to guard protected routes.
 * Full auth validation still happens client-side via Firebase.
 */

const COOKIE_NAME = "wildsaura_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function setSessionCookie(uid: string) {
  document.cookie = `${COOKIE_NAME}=${uid}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

export function clearSessionCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
