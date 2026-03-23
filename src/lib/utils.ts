import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

// ── Tailwind class merger ─────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Price formatter ───────────────────────────────────────────
/** Formats NPR price: 1500 → "NPR 1,500" */
export function formatPriceNPR(amount: number): string {
  return `NPR ${amount.toLocaleString("en-NP")}`;
}

/** Points to NPR: 100 pts = NPR 100 (1:1 ratio — adjust as needed) */
export function pointsToNPR(points: number): number {
  return points;
}

// ── Date formatters ───────────────────────────────────────────
export function formatDate(date: Date | { seconds: number } | string): string {
  const d = toDate(date);
  return format(d, "dd MMM yyyy");
}

export function timeAgo(date: Date | { seconds: number } | string): string {
  const d = toDate(date);
  return formatDistanceToNow(d, { addSuffix: true });
}

function toDate(date: Date | { seconds: number } | string): Date {
  if (date instanceof Date) return date;
  if (typeof date === "string") return new Date(date);
  // Firebase Timestamp
  return new Date(date.seconds * 1000);
}

// ── String helpers ────────────────────────────────────────────
/** "nature" → "Nature" */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Truncates text to given length */
export function truncate(text: string, maxLen = 80): string {
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

/** Slugify: "Hello World!" → "hello-world" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .trim();
}

// ── Quality score helper ──────────────────────────────────────
export function qualityLabel(score: number): { label: string; color: string } {
  if (score >= 8) return { label: "Premium", color: "text-brand-secondary" };
  if (score >= 6) return { label: "Good",    color: "text-green-600" };
  if (score >= 4) return { label: "Fair",    color: "text-yellow-500" };
  return           { label: "Low",   color: "text-red-500" };
}

// ── eSewa helpers ─────────────────────────────────────────────
/** Generates a unique transaction UUID */
export function generateTransactionId(): string {
  return `WS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
