// ==========================================
// 1. USER MODEL (Drishya App & Marketplace)
// ==========================================
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  isVerified: boolean;        // KYC Status (true = Nagarikta verified)
  walletPoints: number;       // Total Points / Earnings (e.g. 1000)
  esewaId?: string;           // eSewa number for receiving payouts
  role: "creator" | "admin";
  createdAt: Date | FirebaseTimestamp;
}

// ==========================================
// 2. PHOTO MODEL (Gemini AI + Shutterstock Ready)
// ==========================================
export interface StockPhoto {
  id: string;                 // Firestore Document ID
  ownerId: string;            // User.uid
  imageUrl: string;           // Firebase Storage – high-res
  thumbnailUrl: string;       // Compressed / WebP for fast loading

  // AI Generated Metadata (Gemini)
  title: string;              // e.g. "Pashupatinath Evening Aarti"
  description?: string;       // 2-3 sentence description
  tags: string[];             // ["Nepal", "Culture", "Temple", ...]
  category: PhotoCategory;    // Primary category
  aiQualityScore: number;     // 1–10 (market demand + clarity)

  // E-commerce
  priceNPR: number;           // Selling price in NPR
  status: "pending" | "approved" | "rejected";
  isPublic: boolean;
  salesCount: number;
  resolution?: string;        // e.g. "4032x3024"
  fileSizeMB?: number;
  createdAt: Date | FirebaseTimestamp;
}

// ==========================================
// 3. PHOTO CATEGORIES
// ==========================================
export type PhotoCategory =
  | "nature"
  | "wildlife"
  | "culture"
  | "food"
  | "architecture"
  | "people"
  | "adventure"
  | "abstract"
  | "aerial"
  | "other";

// ==========================================
// 4. PAYOUT & WALLET MODEL
// ==========================================
export interface PayoutRequest {
  requestId: string;
  userId: string;
  requestedPoints: number;    // e.g. 1000
  payoutMethod: "esewa" | "khalti" | "bank";
  payoutDetails: string;      // Phone number or bank account info
  status: "pending" | "processing" | "completed" | "rejected";
  requestedAt: Date | FirebaseTimestamp;
  processedAt?: Date | FirebaseTimestamp;
  adminNote?: string;
}

// ==========================================
// 5. PURCHASE / LICENSE MODEL
// ==========================================
export interface PhotoPurchase {
  purchaseId: string;
  buyerId: string;
  photoId: string;
  photoTitle: string;
  amountNPR: number;
  paymentMethod: "esewa" | "khalti" | "wallet";
  transactionRef: string;     // eSewa / Khalti transaction token
  status: "pending" | "completed" | "failed" | "refunded";
  downloadUrl?: string;       // Signed URL (expires in 24h)
  purchasedAt: Date | FirebaseTimestamp;
}

// ==========================================
// 6. CART ITEM (Client-side only)
// ==========================================
export interface CartItem {
  photoId: string;
  title: string;
  thumbnailUrl: string;
  priceNPR: number;
}

// ==========================================
// 7. API RESPONSE WRAPPER
// ==========================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==========================================
// 8. PARTNER / EXTERNAL LICENSE
// ==========================================
export interface PartnerLicense {
  partnerId: "shutterstock" | "adobe_stock" | "getty";
  photoId: string;
  externalId?: string;        // ID on partner platform after submission
  status: "submitted" | "approved" | "rejected" | "live";
  royaltyPercent: number;     // e.g. 30 (%)
  submittedAt: Date | FirebaseTimestamp;
}

// Alias for Firebase Timestamp compat
type FirebaseTimestamp = { seconds: number; nanoseconds: number };
