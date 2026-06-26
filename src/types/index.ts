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

// ─── Equipment Category ───────────────────────────────
export type EquipmentCategory =
  | "camera"
  | "lens"
  | "tripod"
  | "lighting"
  | "bag"
  | "computer"
  | "mobile"
  | "flash"
  | "memorycard"
  | "battery"
  | "other";

export type EquipmentCondition = "new" | "like-new" | "used" | "refurbished";
export type EquipmentContactPreference = "email" | "phone" | "wildsaura-message";

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

  // Photographer extended
  portfolioUrl?: string;
  copyrightNotice?: string;

  // Location
  location?: string;
  country?: string;
  gpsCoordinates?: { lat: number; lng: number } | null;

  // Camera & Technical
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  dateTaken?: string;
  whiteBalance?: string;
  colorSpace?: string;
  software?: string;

  // Licensing
  licenseType?: string;
  modelRelease?: string;
  propertyRelease?: string;
  usageNotes?: string;
}

// ─── Equipment Listing ────────────────────────────────
export interface EquipmentListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerPhone?: string;
  sellerEmail: string;
  
  title: string;
  description: string;
  category: EquipmentCategory;
  
  priceNPR: number;
  condition: EquipmentCondition;
  
  imageUrls: string[];
  thumbnailUrl: string;
  
  brand?: string;
  model?: string;
  yearPurchased?: number;
  
  tags: string[];
  location?: string;
  contactPreference?: EquipmentContactPreference;
  
  viewCount: number;
  salesCount: number;
  
  status: "active" | "sold" | "inactive";
  isVerified: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// ─── Cart ─────────────────────────────────────────────
export type CartItemType = "photo" | "equipment";

export interface CartItem {
  type?: CartItemType;
  photoId: string;
  equipmentId?: string;
  title: string;
  thumbnailUrl: string;
  priceNPR: number;
  ownerId?: string;
  ownerName?: string;
  sellerId?: string;
  sellerName?: string;
}

export interface EquipmentCartItem {
  equipmentId: string;
  title: string;
  thumbnailUrl: string;
  priceNPR: number;
  sellerName: string;
}

// ─── Order ────────────────────────────────────────────
export type OrderStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "esewa" | "khalti" | "wallet_points" | "cash_on_delivery";

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

export interface EquipmentOrder {
  id: string;
  buyerId: string;
  buyerEmail: string;
  items: EquipmentOrderItem[];
  totalNPR: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  shippingAddress?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface EquipmentOrderItem {
  equipmentId: string;
  title: string;
  thumbnailUrl: string;
  priceNPR: number;
  sellerId: string;
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

// ─── Equipment Categories Config ──────────────────────
export const EQUIPMENT_CATEGORIES: {
  value: EquipmentCategory;
  label: string;
  icon: string;
  description: string;
}[] = [
  { value: "camera", label: "Cameras", icon: "📷", description: "DSLRs, Mirrorless, Point & Shoot" },
  { value: "lens", label: "Lenses", icon: "🔍", description: "Prime, Zoom, Specialty Lenses" },
  { value: "tripod", label: "Tripods", icon: "🎥", description: "Tripods, Monopods, Stabilizers" },
  { value: "lighting", label: "Lighting", icon: "💡", description: "Flashes, Softboxes, Reflectors" },
  { value: "bag", label: "Bags & Cases", icon: "🎒", description: "Camera Bags, Cases, Straps" },
  { value: "computer", label: "Computers", icon: "💻", description: "Laptops, Desktops, Monitors" },
  { value: "mobile", label: "Mobile Phones", icon: "📱", description: "Smartphones, Tablets, Accessories" },
  { value: "flash", label: "Flash & Lighting", icon: "⚡", description: "External Flashes, LED Lights" },
  { value: "memorycard", label: "Memory Cards", icon: "💾", description: "SD Cards, CFast, XQD" },
  { value: "battery", label: "Batteries & Chargers", icon: "🔋", description: "Batteries, Chargers, Power Banks" },
  { value: "other", label: "Other Equipment", icon: "📦", description: "Miscellaneous Photography Gear" },
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
