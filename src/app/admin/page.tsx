"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  getCountFromServer,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, auth, storage } from "@/lib/firebase";
import { ref as refStorage, uploadBytes, getDownloadURL } from "firebase/storage";
import { StockPhoto, UserProfile, PhotoCategory, CATEGORIES } from "@/types";
import toast, { Toaster } from "react-hot-toast";
import { AISettingsTab } from "./_components/AISettingsTab";
import { LicensesTab } from "./_components/LicensesTab";
import { ListingsTab } from "./_components/ListingsTab";
import { OverviewTab } from "./_components/OverviewTab";
import { PhotosTab } from "./_components/PhotosTab";
import { SalesTab } from "./_components/SalesTab";
import { UploadTab } from "./_components/UploadTab";
import { UsersTab } from "./_components/UsersTab";
import exifr from "exifr";
import {
  Shield,
  Camera,
  Users,
  ListChecks,
  BarChart3,
  Check,
  X,
  Eye,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  AlertTriangle,
  Star,
  TrendingUp,
  DollarSign,
  ImageIcon,
  UserCheck,
  Package,
  RefreshCw,
  CheckSquare,
  Square,
  Filter,
  ToggleLeft,
  ToggleRight,
  Save,
  Info,
  AlertCircle,
  ShoppingCart,
  CreditCard,
  UserX,
  Mail,
  Calendar,
  ArrowUpRight,
  Hash,
  Receipt,
  Settings,
  Key,
  Cpu,
  Zap,
  Bot,
  MessageSquare,
  Eye as EyeIcon,
  EyeOff,
  Globe,
  FileText,
  ShieldCheck,
  Upload,
  Loader2,
  CheckCircle,
} from "lucide-react";

// ─── Admin Email ───────────────────────────────────────────────────────────────
const ADMIN_EMAIL = "madan123050@gmail.com";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value: Timestamp | Date | string | null | undefined): string {
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

function formatDateTime(value: Timestamp | Date | string | null | undefined): string {
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

function statusBadge(status: string) {
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

function roleBadge(role: string) {
  const map: Record<string, string> = {
    admin: "bg-purple-100 text-purple-800 border-purple-200",
    creator: "bg-emerald-100 text-emerald-800 border-emerald-200",
    buyer: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return map[role] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type TabKey = "overview" | "photos" | "users" | "listings" | "sales" | "licenses" | "ai-settings" | "upload";
type PhotoFilter = "all" | "pending" | "approved" | "rejected" | "appeal";

interface PurchaseRecord {
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

interface OrderRecord {
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

interface StatData {
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

// ─── AI Settings Types ─────────────────────────────────────────────────────────

interface AIServiceConfig {
  label: string;
  description: string;
  provider: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  systemPrompt?: string;
}

interface AISettings {
  photoAnalysis: AIServiceConfig;
  chatbot: AIServiceConfig;
  contentModeration: AIServiceConfig;
  seoOptimization: AIServiceConfig;
  updatedAt?: string;
  updatedBy?: string;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  // Auth state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Photos tab
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>("pending");
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [previewPhoto, setPreviewPhoto] = useState<StockPhoto | null>(null);

  // Users tab
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [viewUser, setViewUser] = useState<UserProfile | null>(null);

  // Listings tab
  const [listings, setListings] = useState<StockPhoto[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [editListing, setEditListing] = useState<StockPhoto | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priceNPR: 0,
    category: "" as PhotoCategory | string,
    tags: "",
    status: "pending" as "pending" | "approved" | "rejected",
    isPublic: true,
  });
  const [listingSearch, setListingSearch] = useState("");

  // Sales tab
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesSearch, setSalesSearch] = useState("");
  const [salesView, setSalesView] = useState<"purchases" | "orders">("purchases");
  const [viewOrder, setViewOrder] = useState<OrderRecord | null>(null);

  // Stats / Overview
  const [stats, setStats] = useState<StatData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Upload tab
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadImageUrl, setUploadImageUrl] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [uploadTagInput, setUploadTagInput] = useState("");
  const [uploadCategory, setUploadCategory] = useState<string>("nature");
  const [uploadPrice, setUploadPrice] = useState(100);
  const [uploadCamera, setUploadCamera] = useState("");
  const [uploadLens, setUploadLens] = useState("");
  const [uploadFocalLength, setUploadFocalLength] = useState("");
  const [uploadAperture, setUploadAperture] = useState("");
  const [uploadShutterSpeed, setUploadShutterSpeed] = useState("");
  const [uploadIso, setUploadIso] = useState("");
  const [uploadLocation, setUploadLocation] = useState("");
  const [uploadCountry, setUploadCountry] = useState("");
  const [uploadPhotographerName, setUploadPhotographerName] = useState("");
  const [uploadLicenseType, setUploadLicenseType] = useState<"Standard" | "Extended" | "Editorial">("Standard");
  const [uploadStep, setUploadStep] = useState<"select" | "analyzing" | "edit" | "uploading" | "done">("select");
  const [uploadAiError, setUploadAiError] = useState("");
  const uploadFileRef = useRef<HTMLInputElement>(null);

  // ─── Auth Check ────────────────────────────────────────────────────────────
  // Only madan123050@gmail.com can access the admin dashboard

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // ✅ Check email matches admin email
        if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // ─── Fetch Photos ─────────────────────────────────────────────────────────

  const fetchPhotos = useCallback(async () => {
    setPhotosLoading(true);
    try {
      // Fetch all photos and filter client-side to avoid composite index requirement
      const allQuery = query(collection(db, "photos"), orderBy("createdAt", "desc"));
      const allSnap = await getDocs(allQuery);
      // Exclude WildSaura portfolio photos — only show marketplace photos (source !== "wildsaura")
      const marketDocs = allSnap.docs.filter((d) => d.data().source !== "wildsaura");
      const snap = {
        docs: photoFilter === "all"
          ? marketDocs
          : marketDocs.filter((d) => d.data().status === photoFilter),
      };
      const results: StockPhoto[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as StockPhoto[];
      setPhotos(results);
      setSelectedPhotoIds(new Set());
    } catch (err) {
      console.error("Error fetching photos:", err);
      toast.error("Failed to load photos");
    } finally {
      setPhotosLoading(false);
    }
  }, [photoFilter]);

  useEffect(() => {
    if (isAdmin && activeTab === "photos") {
      fetchPhotos();
    }
  }, [isAdmin, activeTab, fetchPhotos]);

  // ─── Fetch Users ──────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const results: UserProfile[] = snap.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      })) as UserProfile[];
      setUsers(results);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === "users") {
      fetchUsers();
    }
  }, [isAdmin, activeTab, fetchUsers]);

  // ─── Fetch Listings ───────────────────────────────────────────────────────

  const fetchListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const results: StockPhoto[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as StockPhoto[];
      setListings(results);
    } catch (err) {
      console.error("Error fetching listings:", err);
      toast.error("Failed to load listings");
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === "listings") {
      fetchListings();
    }
  }, [isAdmin, activeTab, fetchListings]);

  // ─── Fetch Sales (Purchases & Orders) ─────────────────────────────────────

  const fetchSales = useCallback(async () => {
    setSalesLoading(true);
    try {
      // Fetch purchases
      const purchasesSnap = await getDocs(
        query(collection(db, "purchases"), orderBy("createdAt", "desc"))
      );
      const purchaseResults: PurchaseRecord[] = purchasesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as PurchaseRecord[];
      setPurchases(purchaseResults);

      // Fetch orders
      try {
        const ordersSnap = await getDocs(
          query(collection(db, "orders"), orderBy("createdAt", "desc"))
        );
        const orderResults: OrderRecord[] = ordersSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as OrderRecord[];
        setOrders(orderResults);
      } catch {
        // Orders collection might not exist yet
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching sales:", err);
      toast.error("Failed to load sales data");
    } finally {
      setSalesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === "sales") {
      fetchSales();
    }
  }, [isAdmin, activeTab, fetchSales]);

  // ─── Fetch Stats ──────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Counts
      const photosSnap = await getCountFromServer(collection(db, "photos"));
      const usersSnap = await getCountFromServer(collection(db, "users"));
      const purchasesSnap = await getCountFromServer(collection(db, "purchases"));

      let totalOrders = 0;
      try {
        const ordersSnap = await getCountFromServer(collection(db, "orders"));
        totalOrders = ordersSnap.data().count;
      } catch {
        totalOrders = 0;
      }

      const pendingSnap = await getCountFromServer(
        query(collection(db, "photos"), where("status", "==", "pending"))
      );
      const approvedSnap = await getCountFromServer(
        query(collection(db, "photos"), where("status", "==", "approved"))
      );
      const rejectedSnap = await getCountFromServer(
        query(collection(db, "photos"), where("status", "==", "rejected"))
      );
      const appealSnap = await getCountFromServer(
        query(collection(db, "photos"), where("status", "==", "appeal"))
      );

      // Revenue from purchases
      const purchasesDocs = await getDocs(
        query(collection(db, "purchases"), orderBy("createdAt", "desc"))
      );
      let totalRevenue = 0;
      const recentPurchases: PurchaseRecord[] = [];
      const sellerMap = new Map<string, { name: string; sales: number; revenue: number }>();

      purchasesDocs.forEach((d) => {
        const data = d.data() as PurchaseRecord;
        const amount = data.amountNPR || 0;
        totalRevenue += amount;

        // Collect recent purchases (first 5)
        if (recentPurchases.length < 5) {
          recentPurchases.push({ ...data, id: d.id });
        }

        // Track top sellers
        const sellerId = data.sellerId || "unknown";
        const sellerName = data.sellerName || sellerId;
        const existing = sellerMap.get(sellerId);
        if (existing) {
          existing.sales += 1;
          existing.revenue += amount;
        } else {
          sellerMap.set(sellerId, { name: sellerName, sales: 1, revenue: amount });
        }
      });

      const topSellers = Array.from(sellerMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Category breakdown
      const allPhotosSnap = await getDocs(collection(db, "photos"));
      const catMap = new Map<string, number>();
      allPhotosSnap.forEach((d) => {
        const data = d.data() as StockPhoto;
        const cat = data.category || "Uncategorized";
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
      });
      const categoryBreakdown = Array.from(catMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalPhotos: photosSnap.data().count,
        totalUsers: usersSnap.data().count,
        totalRevenue,
        totalPurchases: purchasesSnap.data().count,
        totalOrders,
        categoryBreakdown,
        pendingCount: pendingSnap.data().count,
        approvedCount: approvedSnap.data().count,
        rejectedCount: rejectedSnap.data().count,
        appealCount: appealSnap.data().count,
        recentPurchases,
        topSellers,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      toast.error("Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === "overview") {
      fetchStats();
    }
  }, [isAdmin, activeTab, fetchStats]);

  // ─── AI Settings State ────────────────────────────────────────────────────
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [aiSettingsLoading, setAiSettingsLoading] = useState(false);
  const [aiSettingsSaving, setAiSettingsSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [apiKeyTestStatus, setApiKeyTestStatus] = useState<Record<string, "idle" | "testing" | "valid" | "invalid">>({});

  const testApiKey = async (serviceKey: string) => {
    if (!firebaseUser || !aiSettings) return;
    const service = aiSettings[serviceKey as keyof AISettings] as AIServiceConfig;
    if (!service?.apiKey) {
      toast.error("Please enter an API key first");
      return;
    }

    setApiKeyTestStatus((prev) => ({ ...prev, [serviceKey]: "testing" }));
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/ai-settings/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ apiKey: service.apiKey, model: service.model }),
      });
      const data = await res.json();
      if (data.valid) {
        setApiKeyTestStatus((prev) => ({ ...prev, [serviceKey]: "valid" }));
        toast.success("\u2705 API key is valid!");
      } else {
        setApiKeyTestStatus((prev) => ({ ...prev, [serviceKey]: "invalid" }));
        toast.error(`\u274C Invalid key: ${data.error}`);
      }
    } catch {
      setApiKeyTestStatus((prev) => ({ ...prev, [serviceKey]: "invalid" }));
      toast.error("Failed to test API key");
    }
  };

  // Auto-migrate old/invalid model names to valid ones
  const VALID_MODELS = ["gemini-2.0-flash", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
  const migrateModel = (model: string | undefined): string => {
    if (model && VALID_MODELS.includes(model)) return model;
    // Map old models to new ones
    if (model?.includes("1.5-pro") || model?.includes("2.5-pro")) return "gemini-2.5-pro";
    return "gemini-2.0-flash"; // default for any invalid/old model
  };

  const migrateSettings = (data: AISettings): AISettings => {
    const migrate = (service: AIServiceConfig | undefined) =>
      service ? { ...service, model: migrateModel(service.model) } : service;
    return {
      ...data,
      photoAnalysis: migrate(data.photoAnalysis) as AIServiceConfig,
      chatbot: migrate(data.chatbot) as AIServiceConfig,
      contentModeration: migrate(data.contentModeration) as AIServiceConfig,
      seoOptimization: migrate(data.seoOptimization) as AIServiceConfig,
    };
  };

  const fetchAISettings = useCallback(async () => {
    if (!firebaseUser) return;
    setAiSettingsLoading(true);
    try {
      const docRef = doc(db, "settings", "ai-config");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setAiSettings(migrateSettings(snap.data() as AISettings));
      } else {
        // Set defaults
        setAiSettings({
          photoAnalysis: {
            label: "Photo Analysis AI",
            description: "Analyzes uploaded photos — generates title, tags, category, quality score & price suggestion",
            provider: "gemini",
            apiKey: "",
            model: "gemini-2.0-flash",
            enabled: true,
          },
          chatbot: {
            label: "Market Chatbot AI",
            description: "Customer support chatbot — answers market queries, photo search help, pricing info",
            provider: "gemini",
            apiKey: "",
            model: "gemini-2.0-flash",
            enabled: false,
            systemPrompt: "You are WildSaura Market assistant. Help users find photos, understand pricing, and navigate the marketplace. Be friendly and concise. Answer in the user\'s language.",
          },
          contentModeration: {
            label: "Content Moderation AI",
            description: "Auto-screens uploads for inappropriate, copyrighted, or low-quality content",
            provider: "gemini",
            apiKey: "",
            model: "gemini-2.0-flash",
            enabled: false,
          },
          seoOptimization: {
            label: "SEO & Description AI",
            description: "Generates SEO-optimized titles, meta descriptions & alt text for better discoverability",
            provider: "gemini",
            apiKey: "",
            model: "gemini-2.0-flash",
            enabled: false,
          },
        });
      }
    } catch (err) {
      console.error("AI Settings load error:", err);
      toast.error("Could not load AI settings");
    } finally {
      setAiSettingsLoading(false);
    }
  }, [firebaseUser]);

  const saveAISettings = async () => {
    if (!firebaseUser || !aiSettings) return;
    setAiSettingsSaving(true);
    try {
      const docRef = doc(db, "settings", "ai-config");
      await setDoc(docRef, {
        ...aiSettings,
        updatedAt: new Date().toISOString(),
        updatedBy: firebaseUser.email,
      }, { merge: true });
      toast.success("AI settings saved successfully!");
    } catch (err) {
      console.error("AI Settings save error:", err);
      toast.error("Failed to save AI settings");
    } finally {
      setAiSettingsSaving(false);
    }
  };

  const updateAIService = (
    key: keyof AISettings,
    field: string,
    value: string | boolean
  ) => {
    setAiSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: { ...(prev[key] as AIServiceConfig), [field]: value },
      };
    });
  };

  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };


  // ─── AI Settings fetch effect
  useEffect(() => {
    if (isAdmin && activeTab === "ai-settings") {
      fetchAISettings();
    }
  }, [isAdmin, activeTab, fetchAISettings]);

  // ─── Admin Upload Handlers ──────────────────────────────────────────────────
  const handleAdminFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 100 * 1024 * 1024) { toast.error("Image must be under 100MB"); return; }
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setUploadStep("analyzing");

    // ── Auto-extract EXIF/camera data from the original file ──
    try {
      let exifData: any = null;
      try {
        exifData = await exifr.parse(file, {
          pick: [
            "Make", "Model", "LensModel", "FocalLength",
            "FocalLengthIn35mmFormat", "FNumber", "ExposureTime",
            "ISO", "latitude", "longitude",
          ],
        });
      } catch (e) {
        console.warn("EXIF extraction failed:", e);
      }
      if (exifData) {
        if (exifData.Make && exifData.Model)
          setUploadCamera(`${exifData.Make} ${exifData.Model}`.trim());
        else if (exifData.Model) setUploadCamera(exifData.Model);
        if (exifData.LensModel) setUploadLens(exifData.LensModel);
        if (exifData.FocalLength) {
          const fl35 = exifData.FocalLengthIn35mmFormat;
          setUploadFocalLength(
            fl35 && fl35 !== exifData.FocalLength
              ? `${exifData.FocalLength}mm (${fl35}mm equiv.)`
              : `${exifData.FocalLength}mm`
          );
        }
        if (exifData.FNumber) setUploadAperture(`f/${exifData.FNumber}`);
        if (exifData.ExposureTime) {
          setUploadShutterSpeed(
            exifData.ExposureTime >= 1
              ? `${exifData.ExposureTime}s`
              : `1/${Math.round(1 / exifData.ExposureTime)}s`
          );
        }
        if (exifData.ISO) setUploadIso(String(exifData.ISO));
        if (exifData.latitude && exifData.longitude) {
          // Reverse geocode could be added later
          setUploadLocation(`${exifData.latitude.toFixed(4)}, ${exifData.longitude.toFixed(4)}`);
        }
        if (exifData.Make || exifData.Model || exifData.LensModel) {
          toast.success("📷 Camera details auto-detected from EXIF!");
        }
      }
    } catch (exifErr) {
      console.warn("EXIF extraction failed:", exifErr);
    }

    adminUploadAndAnalyze(file);
  };

  const adminUploadAndAnalyze = async (file: File) => {
    if (!firebaseUser) return;
    setUploadAiError("");
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const storageRef = refStorage(storage, `marketplace/${firebaseUser.uid}/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setUploadImageUrl(downloadUrl);

      try {
        const aiResp = await fetch("/api/ai-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: downloadUrl }),
        });
        if (aiResp.ok) {
          const aiData = await aiResp.json();
          if (aiData.is_marketable === false) {
            setUploadAiError(`Photo rejected: ${aiData.rejection_reason || "Not suitable for marketplace"}`);
          } else {
            setUploadTitle(aiData.title || "");
            setUploadDescription(aiData.description || "");
            setUploadTags(aiData.tags || []);
            setUploadCategory(aiData.category || "nature");
            const basePrice = aiData.quality_score >= 8 ? 200 : aiData.quality_score >= 6 ? 150 : 100;
            const demandMul = aiData.market_demand === "High" ? 1.5 : aiData.market_demand === "Medium" ? 1.2 : 1;
            setUploadPrice(Math.round(basePrice * demandMul));
          }
        } else {
          const errData = await aiResp.json().catch(() => ({}));
          const detail = errData?.details || errData?.error || `HTTP ${aiResp.status}`;
          setUploadAiError(`AI analysis failed: ${detail}`);
          console.error("AI analyze error:", errData);
        }
      } catch (aiErr) {
        console.error("AI analyze exception:", aiErr);
        setUploadAiError(`AI analysis failed: ${aiErr instanceof Error ? aiErr.message : "Network error"}`);
      }
      setUploadStep("edit");
    } catch (err) {
      console.error("Admin upload error:", err);
      toast.error("Failed to upload image.");
      setUploadStep("select");
    }
  };

  const handleAdminUploadSubmit = async () => {
    if (!firebaseUser || !uploadImageUrl) return;
    if (!uploadTitle.trim()) { toast.error("Title is required"); return; }
    if (uploadPrice < 10) { toast.error("Minimum price is NPR 10"); return; }

    setUploadStep("uploading");
    try {
      await addDoc(collection(db, "photos"), {
        source: "market",  // Tag as marketplace photo (shared DB with WildSaura)
        ownerId: firebaseUser.uid,
        ownerName: uploadPhotographerName.trim() || firebaseUser.displayName || firebaseUser.email || "Admin",
        photographerName: uploadPhotographerName.trim() || firebaseUser.displayName || firebaseUser.email || "Admin",
        ownerAvatar: firebaseUser.photoURL || "",
        imageUrl: uploadImageUrl,
        thumbnailUrl: uploadImageUrl,
        title: uploadTitle.trim(),
        description: uploadDescription.trim(),
        tags: uploadTags,
        category: uploadCategory,
        priceNPR: uploadPrice,
        status: "approved",
        isPublic: true,
        salesCount: 0,
        viewCount: 0,
        downloadCount: 0,
        qualityScore: 8,
        aiQualityScore: 8,
        marketDemand: "Medium",
        aiRejected: false,
        // Camera & Technical details
        ...(uploadCamera && { camera: uploadCamera.trim() }),
        ...(uploadLens && { lens: uploadLens.trim() }),
        ...(uploadFocalLength && { focalLength: uploadFocalLength.trim() }),
        ...(uploadAperture && { aperture: uploadAperture.trim() }),
        ...(uploadShutterSpeed && { shutterSpeed: uploadShutterSpeed.trim() }),
        ...(uploadIso && { iso: uploadIso.trim() }),
        ...(uploadLocation && { location: uploadLocation.trim() }),
        ...(uploadCountry && { country: uploadCountry.trim() }),
        licenseType: uploadLicenseType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setUploadStep("done");
      toast.success("Photo uploaded & auto-approved! \ud83c\udf89");
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to submit.");
      setUploadStep("edit");
    }
  };

  const handleAdminUploadReset = () => {
    setUploadFile(null);
    setUploadPreview("");
    setUploadImageUrl("");
    setUploadTitle("");
    setUploadDescription("");
    setUploadTags([]);
    setUploadTagInput("");
    setUploadCategory("nature");
    setUploadPrice(100);
    setUploadPhotographerName("");
    setUploadCamera("");
    setUploadLens("");
    setUploadFocalLength("");
    setUploadAperture("");
    setUploadShutterSpeed("");
    setUploadIso("");
    setUploadLocation("");
    setUploadCountry("");
    setUploadLicenseType("Standard");
    setUploadStep("select");
    setUploadAiError("");
    if (uploadFileRef.current) uploadFileRef.current.value = "";
  };

  const handleAdminAddTag = () => {
    const t = uploadTagInput.trim().toLowerCase();
    if (t && !uploadTags.includes(t) && uploadTags.length < 25) {
      setUploadTags([...uploadTags, t]);
      setUploadTagInput("");
    }
  };

  // ─── Photo Actions ────────────────────────────────────────────────────────

  const updatePhotoStatus = async (photoId: string, status: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "photos", photoId), {
        status,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Photo ${status}`);
      fetchPhotos();
    } catch {
      toast.error("Failed to update photo status");
    }
  };

  const bulkUpdateStatus = async (status: "approved" | "rejected") => {
    if (selectedPhotoIds.size === 0) {
      toast.error("No photos selected");
      return;
    }
    try {
      const promises = Array.from(selectedPhotoIds).map((id) =>
        updateDoc(doc(db, "photos", id), {
          status,
          updatedAt: serverTimestamp(),
        })
      );
      await Promise.all(promises);
      toast.success(`${selectedPhotoIds.size} photo(s) ${status}`);
      fetchPhotos();
    } catch {
      toast.error("Bulk update failed");
    }
  };

  const deletePhoto = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "photos", id));
      toast.success("Photo deleted");
      fetchPhotos();
    } catch {
      toast.error("Failed to delete photo");
    }
  };

  const toggleSelectPhoto = (id: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPhotoIds.size === photos.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(photos.map((p) => p.id)));
    }
  };

  // ─── User Actions ─────────────────────────────────────────────────────────

  const changeUserRole = async (uid: string, role: "creator" | "buyer" | "admin") => {
    try {
      await updateDoc(doc(db, "users", uid), { role });
      toast.success(`Role updated to ${role}`);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role } : u))
      );
    } catch {
      toast.error("Failed to update role");
    }
  };

  const toggleVerified = async (uid: string, current: boolean) => {
    try {
      await updateDoc(doc(db, "users", uid), { isVerified: !current });
      toast.success(current ? "Verification removed" : "User verified");
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, isVerified: !current } : u))
      );
    } catch {
      toast.error("Failed to toggle verification");
    }
  };

  const deleteUser = async (uid: string, displayName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${displayName || uid}"? This will remove their profile data. This cannot be undone.`
      )
    )
      return;
    try {
      await deleteDoc(doc(db, "users", uid));
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.displayName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  // ─── Listing Actions ──────────────────────────────────────────────────────

  const openEditModal = (listing: StockPhoto) => {
    setEditListing(listing);
    setEditForm({
      title: listing.title || "",
      description: listing.description || "",
      priceNPR: listing.priceNPR || 0,
      category: listing.category || "",
      tags: (listing.tags || []).join(", "),
      status: listing.status || "pending",
      isPublic: listing.isPublic !== false,
    });
  };

  const saveListingEdit = async () => {
    if (!editListing) return;
    try {
      const tagsArray = editForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await updateDoc(doc(db, "photos", editListing.id), {
        title: editForm.title,
        description: editForm.description,
        priceNPR: Number(editForm.priceNPR),
        category: editForm.category,
        tags: tagsArray,
        status: editForm.status,
        isPublic: editForm.isPublic,
        updatedAt: serverTimestamp(),
      });
      toast.success("Listing updated");
      setEditListing(null);
      fetchListings();
    } catch {
      toast.error("Failed to update listing");
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "photos", id));
      toast.success("Listing deleted");
      fetchListings();
    } catch {
      toast.error("Failed to delete listing");
    }
  };

  const filteredListings = listings.filter((l) => {
    if (!listingSearch) return true;
    const q = listingSearch.toLowerCase();
    return (
      (l.title || "").toLowerCase().includes(q) ||
      (l.ownerName || "").toLowerCase().includes(q) ||
      (l.category || "").toLowerCase().includes(q)
    );
  });

  // ─── Sales Filters ────────────────────────────────────────────────────────

  const filteredPurchases = purchases.filter((p) => {
    if (!salesSearch) return true;
    const q = salesSearch.toLowerCase();
    return (
      (p.photoTitle || "").toLowerCase().includes(q) ||
      (p.buyerEmail || "").toLowerCase().includes(q) ||
      (p.buyerId || "").toLowerCase().includes(q) ||
      (p.sellerName || "").toLowerCase().includes(q) ||
      (p.sellerId || "").toLowerCase().includes(q) ||
      (p.paymentMethod || "").toLowerCase().includes(q)
    );
  });

  const filteredOrders = orders.filter((o) => {
    if (!salesSearch) return true;
    const q = salesSearch.toLowerCase();
    return (
      (o.buyerEmail || "").toLowerCase().includes(q) ||
      (o.status || "").toLowerCase().includes(q) ||
      (o.paymentMethod || "").toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  });

  // Sales summary calculations
  const totalSalesAmount = purchases.reduce((sum, p) => sum + (p.amountNPR || 0), 0);

  // ─── Delete Purchase/Order ────────────────────────────────────────────────

  const deletePurchase = async (id: string) => {
    if (!confirm("Delete this purchase record? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "purchases", id));
      toast.success("Purchase deleted");
      setPurchases((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error("Failed to delete purchase");
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this order record? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "orders", id));
      toast.success("Order deleted");
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch {
      toast.error("Failed to delete order");
    }
  };

  // ─── Loading / Auth States ────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-gray-600 font-medium">Checking admin access…</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-card p-8 border border-surface-border max-w-md text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500">
            Admin dashboard is restricted. Only authorized admin can access this page.
          </p>
          {firebaseUser && (
            <p className="text-sm text-gray-400 mt-3">
              Logged in as: {firebaseUser.email}
            </p>
          )}
        </div>
      </div>
    );
  }




  // ─── Tab Config ───────────────────────────────────────────────────────────

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "photos", label: "Photos", icon: <Camera className="w-4 h-4" /> },
    { key: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { key: "listings", label: "Listings", icon: <ListChecks className="w-4 h-4" /> },
    { key: "sales", label: "Sales", icon: <ShoppingCart className="w-4 h-4" /> },
    { key: "licenses", label: "Licenses", icon: <Shield className="w-4 h-4" /> },
    { key: "ai-settings", label: "AI Settings", icon: <Settings className="w-4 h-4" /> },
    { key: "upload", label: "Upload Photo", icon: <Upload className="w-4 h-4" /> },
  ];

  const adminTabProps = {
    setActiveTab,
    statsLoading,
    stats,
    fetchStats,
    photoFilter,
    setPhotoFilter,
    selectedPhotoIds,
    bulkUpdateStatus,
    photos,
    photosLoading,
    fetchPhotos,
    toggleSelectAll,
    toggleSelectPhoto,
    previewPhoto,
    setPreviewPhoto,
    updatePhotoStatus,
    deletePhoto,
    userSearch,
    setUserSearch,
    fetchUsers,
    filteredUsers,
    usersLoading,
    viewUser,
    setViewUser,
    changeUserRole,
    toggleVerified,
    deleteUser,
    listingSearch,
    setListingSearch,
    fetchListings,
    filteredListings,
    listingsLoading,
    openEditModal,
    deleteListing,
    editListing,
    setEditListing,
    editForm,
    setEditForm,
    saveListingEdit,
    totalSalesAmount,
    orders,
    purchases,
    salesSearch,
    setSalesSearch,
    salesView,
    setSalesView,
    fetchSales,
    salesLoading,
    filteredPurchases,
    filteredOrders,
    deletePurchase,
    deleteOrder,
    viewOrder,
    setViewOrder,
    aiSettings,
    aiSettingsLoading,
    aiSettingsSaving,
    apiKeyTestStatus,
    showApiKeys,
    updateAIService,
    toggleApiKeyVisibility,
    testApiKey,
    saveAISettings,
    uploadFileRef,
    handleAdminFileSelect,
    uploadStep,
    uploadPreview,
    uploadAiError,
    uploadPhotographerName,
    setUploadPhotographerName,
    uploadTitle,
    setUploadTitle,
    uploadDescription,
    setUploadDescription,
    uploadTags,
    uploadTagInput,
    setUploadTagInput,
    handleAdminAddTag,
    setUploadTags,
    uploadCategory,
    setUploadCategory,
    uploadPrice,
    setUploadPrice,
    uploadCamera,
    setUploadCamera,
    uploadLens,
    setUploadLens,
    uploadFocalLength,
    setUploadFocalLength,
    uploadAperture,
    setUploadAperture,
    uploadShutterSpeed,
    setUploadShutterSpeed,
    uploadIso,
    setUploadIso,
    uploadLocation,
    setUploadLocation,
    uploadCountry,
    setUploadCountry,
    uploadLicenseType,
    setUploadLicenseType,
    handleAdminUploadSubmit,
    handleAdminUploadReset,
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Full control — photos, users, listings, sales & stats
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail className="w-4 h-4" />
              <span>{firebaseUser.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-surface-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ─── OVERVIEW TAB ──────────────────────────────────────────── */}
        {activeTab === "overview" && <OverviewTab {...adminTabProps} />}
        {activeTab === "photos" && <PhotosTab {...adminTabProps} />}
        {activeTab === "users" && <UsersTab {...adminTabProps} />}
        {activeTab === "listings" && <ListingsTab {...adminTabProps} />}
        {activeTab === "sales" && <SalesTab {...adminTabProps} />}
        {activeTab === "licenses" && <LicensesTab />}
        {activeTab === "ai-settings" && <AISettingsTab {...adminTabProps} />}
        {activeTab === "upload" && <UploadTab {...adminTabProps} />}
      </div>
    </div>
  );
}




