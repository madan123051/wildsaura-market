import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNPR(amount: number): string {
  return `NPR ${amount.toLocaleString("en-NP")}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

// Aliases and helpers needed by existing pages
export function formatPriceNPR(amount: number): string {
  return formatNPR(amount);
}

export function pointsToNPR(points: number): string {
  return formatNPR(points);
}

export function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function qualityLabel(score: number | undefined): { label: string; color: string } {
  if (score == null) return { label: "Unrated", color: "text-gray-500" };
  if (score >= 8) return { label: "Excellent", color: "text-green-600" };
  if (score >= 6) return { label: "Good", color: "text-blue-600" };
  if (score >= 4) return { label: "Average", color: "text-yellow-600" };
  return { label: "Low", color: "text-red-600" };
}
