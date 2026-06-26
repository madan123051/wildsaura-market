import { Timestamp } from "firebase/firestore";

export type TabKey = "overview" | "photos" | "users" | "listings" | "sales" | "licenses" | "ai-settings" | "upload";
export type PhotoFilter = "all" | "pending" | "approved" | "rejected" | "appeal";

export interface PurchaseRecord {
  id: string;
  photoId: string;
  photoTitle?: string;
  buyerId: string;
  buyerEmail?: string;
  sellerId: string;
  sellerName?: string;
  amountNPR: number;
  paymentMethod?: string;
  transactionRef?: string;
  status?: string;
  createdAt: Timestamp | null;
}

export interface OrderRecord {
  id: string;
  buyerId: string;
  buyerEmail: string;
  items: {
    photoId: string;
    title: string;
    thumbnailUrl: string;
    priceNPR: number;
    ownerId: string;
  }[];
  totalNPR: number;
  status: string;
  paymentMethod: string;
  paymentId?: string;
  createdAt: Timestamp | null;
  completedAt?: Timestamp | null;
}

export interface StatData {
  totalPhotos: number;
  totalUsers: number;
  totalRevenue: number;
  totalPurchases: number;
  totalOrders: number;
  categoryBreakdown: { category: string; count: number }[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  appealCount: number;
  recentPurchases: PurchaseRecord[];
  topSellers: { name: string; sales: number; revenue: number }[];
}

export interface AIServiceConfig {
  label: string;
  description: string;
  provider: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  systemPrompt?: string;
}

export interface AISettings {
  photoAnalysis: AIServiceConfig;
  chatbot: AIServiceConfig;
  contentModeration: AIServiceConfig;
  seoOptimization: AIServiceConfig;
  updatedAt?: string;
  updatedBy?: string;
}

export function formatDate(value: Timestamp | Date | string | null | undefined): string {
  if (!value) return "N/A";
  let date: Date;
  if (value instanceof Timestamp) {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: Timestamp | Date | string | null | undefined): string {
  if (!value) return "N/A";
  let date: Date;
  if (value instanceof Timestamp) {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    appeal: "bg-orange-100 text-orange-800 border-orange-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    paid: "bg-green-100 text-green-800 border-green-200",
    failed: "bg-red-100 text-red-800 border-red-200",
    refunded: "bg-purple-100 text-purple-800 border-purple-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

export function roleBadge(role: string) {
  const map: Record<string, string> = {
    admin: "bg-purple-100 text-purple-800 border-purple-200",
    creator: "bg-emerald-100 text-emerald-800 border-emerald-200",
    buyer: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return map[role] ?? "bg-gray-100 text-gray-800 border-gray-200";
}
