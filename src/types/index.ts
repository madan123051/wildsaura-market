// ─── Photo Category ───────────────────────────────────
export type PhotoCategory =
  | "nature"
  | "wildlife"
  | "landscape"
  | "culture"
  | "adventure"
  | "street"
  | "aerial"
  | "macro";

// ─── User ─────────────────────────────────────────────
export type UserRole = "creator" | "buyer" | "admin";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  isVerified: boolean;
  walletPoints: number;
  role: UserRole;
  totalSales?: number;
  totalPhotos?: number;
  createdAt: Date;
}

// ─── Stock Photo ──────────────────────────────────────
export type PhotoStatus = "pending" | "approved" | "rejected";
export type MarketDemand = "High" | "Medium" | "Low";

export interface StockPhoto {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerAvatar?: string;
  photographerName?: string;
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  tags: string[];
  category: PhotoCategory;
  priceNPR: number;
  status: PhotoStatus;
  isPublic: boolean;
  salesCount: number;
  viewCount?: number;
  downloadCount?: number;
  qualityScore?: number;
  aiQualityScore?: number;
  marketDemand?: MarketDemand;
  width?: number;
  height?: number;
  fileSize?: number;
  createdAt: Date;
  updatedAt?: Date;
}

// ─── Cart ─────────────────────────────────────────────
export interface CartItem {
  photoId: string;
  title: string;
  thumbnailUrl: string;
  priceNPR: number;
  ownerName?: string;
}

// ─── Order ────────────────────────────────────────────
export type OrderStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "esewa" | "khalti" | "wallet_points";

export interface Order {
  id: string;
  buyerId: string;
  buyerEmail: string;
  items: OrderItem[];
  totalNPR: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface OrderItem {
  photoId: string;
  title: string;
  thumbnailUrl: string;
  priceNPR: number;
  ownerId: string;
}

// ─── Download ─────────────────────────────────────────
export interface Download {
  id: string;
  orderId: string;
  photoId: string;
  buyerId: string;
  imageUrl: string;
  title: string;
  thumbnailUrl: string;
  downloadedAt?: Date;
  purchasedAt: Date;
  lastLicenseCode?: string;
  lastDownloadAt?: Date;
  downloadCount?: number;
}

// ─── License ──────────────────────────────────────────
export type LicenseType = "standard" | "extended";

export interface License {
  id: string;
  licenseCode: string;
  photoId: string;
  photoTitle: string;
  thumbnailUrl: string;
  buyerId: string;
  buyerEmail: string;
  photographerId: string;
  photographerName: string;
  category: string;
  priceNPR: number;
  orderId: string;
  purchaseDate: Date;
  downloadDate: Date;
  isValid: boolean;
  licenseType: LicenseType;
  hasWatermark: boolean;
}

// ─── Partner License ──────────────────────────────────
export interface PartnerLicense {
  partnerId: string;
  photoId: string;
  externalId: string;
  status: "submitted" | "approved" | "rejected" | "live";
  royaltyPercent: number;
  submittedAt: Date;
}

// ─── API Response ─────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Drishya App Config ───────────────────────────────
export const DRISHYA_APP_URL =
  process.env.NEXT_PUBLIC_DRISHYA_APP_URL || "https://drishya.wildsaura.com";

// ─── Categories Config ────────────────────────────────
export const CATEGORIES: {
  value: PhotoCategory;
  label: string;
  icon: string;
  description: string;
}[] = [
  { value: "nature", label: "Nature", icon: "🌿", description: "Forests, flowers, plants" },
  { value: "wildlife", label: "Wildlife", icon: "🦁", description: "Animals in their habitat" },
  { value: "landscape", label: "Landscape", icon: "🏔️", description: "Mountains, valleys, scenery" },
  { value: "culture", label: "Culture", icon: "🏛️", description: "Traditions, festivals, heritage" },
  { value: "adventure", label: "Adventure", icon: "🧗", description: "Trekking, sports, extreme" },
  { value: "street", label: "Street", icon: "🏙️", description: "Urban life, people, city" },
  { value: "aerial", label: "Aerial", icon: "🚁", description: "Drone shots, bird eye view" },
  { value: "macro", label: "Macro", icon: "🔬", description: "Close-up, tiny details" },
];

// ─── Photo Purchase ───────────────────────────────────
export interface PhotoPurchase {
  purchaseId: string;
  buyerId: string;
  photoId: string;
  photoTitle: string;
  amountNPR: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  status: "pending" | "completed" | "failed" | "refunded";
  purchasedAt: Date;
}
