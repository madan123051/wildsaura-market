import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNPR(amount: number | undefined | null): string {
  if (amount == null || isNaN(amount as number)) return "NPR \u2014";
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
  return str.length > max ? str.slice(0, max) + "\u2026" : str;
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

// ── Community helpers ──────────────────────────────────────────────────────

/**
 * Returns a human-readable relative time string (e.g. "2h ago").
 * Accepts a Firestore Timestamp object, a Date, or an ISO string.
 */
export function timeAgo(timestamp: any): string {
  if (!timestamp) return '';
  let date: Date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Compresses an image File to a JPEG Blob under ~800 KB.
 */
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const MAX_SIZE = 1200;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE; }
        else { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}
