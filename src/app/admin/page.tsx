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
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
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

type TabKey = "overview" | "photos" | "users" | "listings" | "sales" | "ai-settings" | "upload";
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
      const snap = {
        docs: photoFilter === "all"
          ? allSnap.docs
          : allSnap.docs.filter((d) => d.data().status === photoFilter),
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

  const fetchAISettings = useCallback(async () => {
    if (!firebaseUser) return;
    setAiSettingsLoading(true);
    try {
      const docRef = doc(db, "settings", "ai-config");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setAiSettings(snap.data() as AISettings);
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
  const handleAdminFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error("Image must be under 15MB"); return; }
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setUploadStep("analyzing");
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
          setUploadTitle(aiData.title || "");
          setUploadDescription(aiData.description || "");
          setUploadTags(aiData.tags || []);
          setUploadCategory(aiData.category || "nature");
          const basePrice = aiData.quality_score >= 8 ? 200 : aiData.quality_score >= 6 ? 150 : 100;
          const demandMul = aiData.market_demand === "High" ? 1.5 : aiData.market_demand === "Medium" ? 1.2 : 1;
          setUploadPrice(Math.round(basePrice * demandMul));
        } else {
          setUploadAiError("AI analysis failed \u2014 fill details manually.");
        }
      } catch {
        setUploadAiError("AI analysis failed \u2014 fill details manually.");
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
        ownerId: firebaseUser.uid,
        ownerName: firebaseUser.displayName || firebaseUser.email || "Admin",
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
    { key: "ai-settings", label: "AI Settings", icon: <Settings className="w-4 h-4" /> },
    { key: "upload", label: "Upload Photo", icon: <Upload className="w-4 h-4" /> },
  ];

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
        {activeTab === "overview" && (
          <div>
            {statsLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Photos</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalPhotos}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          NPR {stats.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-purple-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Sales</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-pink-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photo Status Breakdown */}
                <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Photo Status Breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 text-center">
                      <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-800">{stats.pendingCount}</p>
                      <p className="text-xs text-yellow-600 font-medium">Pending</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 text-center">
                      <AlertCircle className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-orange-800">{stats.appealCount}</p>
                      <p className="text-xs text-orange-600 font-medium">Appeals</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-800">{stats.approvedCount}</p>
                      <p className="text-xs text-green-600 font-medium">Approved</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
                      <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-800">{stats.rejectedCount}</p>
                      <p className="text-xs text-red-600 font-medium">Rejected</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Purchases */}
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-gray-900">Recent Sales</h3>
                      <button
                        onClick={() => setActiveTab("sales")}
                        className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        View all <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                    {stats.recentPurchases.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">No sales yet</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.recentPurchases.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {p.photoTitle || p.photoId}
                              </p>
                              <p className="text-xs text-gray-400">
                                Buyer: {p.buyerEmail || p.buyerId} • {formatDate(p.createdAt)}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-emerald-700">
                              NPR {(p.amountNPR || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top Sellers */}
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <h3 className="text-base font-bold text-gray-900 mb-4">Top Sellers</h3>
                    {stats.topSellers.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">No sellers yet</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.topSellers.map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-emerald-700">
                                  #{i + 1}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                                <p className="text-xs text-gray-400">{s.sales} sales</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              NPR {s.revenue.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Categories */}
                <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Top Categories</h3>
                  {stats.categoryBreakdown.length === 0 ? (
                    <p className="text-sm text-gray-400">No categories to display</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.categoryBreakdown.slice(0, 10).map((cat) => {
                        const maxCount = stats.categoryBreakdown[0]?.count || 1;
                        const pct = Math.round((cat.count / maxCount) * 100);
                        return (
                          <div key={cat.category}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {cat.category}
                              </span>
                              <span className="text-sm text-gray-500">{cat.count} photos</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-emerald-500 h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Refresh */}
                <div className="flex justify-center">
                  <button
                    onClick={fetchStats}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 flex items-center gap-1.5 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh Stats
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Info className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Stats unavailable</p>
                <p className="text-sm mt-1">Could not load statistics.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── PHOTOS TAB ────────────────────────────────────────────── */}
        {activeTab === "photos" && (
          <div>
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Filter:</span>
                  {(["pending", "appeal", "approved", "rejected", "all"] as PhotoFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPhotoFilter(f)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                        photoFilter === f
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => bulkUpdateStatus("approved")}
                    disabled={selectedPhotoIds.size === 0}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve ({selectedPhotoIds.size})
                  </button>
                  <button
                    onClick={() => bulkUpdateStatus("rejected")}
                    disabled={selectedPhotoIds.size === 0}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject ({selectedPhotoIds.size})
                  </button>
                  <button
                    onClick={fetchPhotos}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    <RefreshCw className={`w-4 h-4 ${photosLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-card border border-surface-border overflow-hidden">
              {photosLoading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <ImageIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No photos found</p>
                  <p className="text-sm mt-1">No {photoFilter !== "all" ? photoFilter : ""} photos to display.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-surface-border">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                            {selectedPhotoIds.size === photos.length ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Photo</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Photographer</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Price</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {photos.map((photo) => (
                        <tr key={photo.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleSelectPhoto(photo.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {selectedPhotoIds.has(photo.id) ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                                {photo.thumbnailUrl || photo.imageUrl ? (
                                  <Image
                                    src={photo.thumbnailUrl || photo.imageUrl}
                                    alt={photo.title || "Photo"}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-gray-300" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate max-w-[200px]">
                                  {photo.title || "Untitled"}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatDate(photo.createdAt)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {photo.ownerAvatar ? (
                                <Image
                                  src={photo.ownerAvatar}
                                  alt={photo.ownerName || "User"}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-emerald-700">
                                    {(photo.ownerName || "?")[0]?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="text-gray-700 text-sm">{photo.ownerName || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-600 text-sm capitalize">{photo.category || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-700 font-medium text-sm">NPR {photo.priceNPR ?? 0}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(
                                photo.status
                              )}`}
                            >
                              {photo.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                              {photo.status === "approved" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {photo.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                              {photo.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setPreviewPhoto(photo)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {photo.status !== "approved" && (
                                <button
                                  onClick={() => updatePhotoStatus(photo.id, "approved")}
                                  className="p-1.5 text-green-500 hover:text-green-700 rounded-lg hover:bg-green-50"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              {photo.status !== "rejected" && (
                                <button
                                  onClick={() => updatePhotoStatus(photo.id, "rejected")}
                                  className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deletePhoto(photo.id)}
                                className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Photo Preview Modal */}
            {previewPhoto && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={() => setPreviewPhoto(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">{previewPhoto.title || "Untitled"}</h3>
                      <button
                        onClick={() => setPreviewPhoto(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4">
                      {previewPhoto.imageUrl ? (
                        <Image
                          src={previewPhoto.imageUrl}
                          alt={previewPhoto.title || "Photo"}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 672px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Photographer</span>
                        <p className="font-medium text-gray-900">{previewPhoto.ownerName || "Unknown"}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Category</span>
                        <p className="font-medium text-gray-900 capitalize">{previewPhoto.category || "—"}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Price</span>
                        <p className="font-medium text-gray-900">NPR {previewPhoto.priceNPR ?? 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Status</span>
                        <p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(
                              previewPhoto.status
                            )}`}
                          >
                            {previewPhoto.status}
                          </span>
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">Description</span>
                        <p className="font-medium text-gray-900">{previewPhoto.description || "No description"}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">Tags</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(previewPhoto.tags || []).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {(!previewPhoto.tags || previewPhoto.tags.length === 0) && (
                            <span className="text-gray-400 text-xs">No tags</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-lg font-bold text-gray-900">{previewPhoto.viewCount ?? 0}</p>
                        <p className="text-xs text-gray-400">Views</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-lg font-bold text-gray-900">{previewPhoto.downloadCount ?? 0}</p>
                        <p className="text-xs text-gray-400">Downloads</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-lg font-bold text-gray-900">{previewPhoto.salesCount ?? 0}</p>
                        <p className="text-xs text-gray-400">Sales</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      {previewPhoto.status !== "approved" && (
                        <button
                          onClick={() => {
                            updatePhotoStatus(previewPhoto.id, "approved");
                            setPreviewPhoto(null);
                          }}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 flex items-center gap-1.5 text-sm"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                      )}
                      {previewPhoto.status !== "rejected" && (
                        <button
                          onClick={() => {
                            updatePhotoStatus(previewPhoto.id, "rejected");
                            setPreviewPhoto(null);
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 flex items-center gap-1.5 text-sm"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      )}
                      <button
                        onClick={() => {
                          deletePhoto(previewPhoto.id);
                          setPreviewPhoto(null);
                        }}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-medium hover:bg-red-200 flex items-center gap-1.5 text-sm"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                      <button
                        onClick={() => setPreviewPhoto(null)}
                        className="px-4 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 text-sm ml-auto"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── USERS TAB ─────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div>
            {/* Search bar */}
            <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border mb-6">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={fetchUsers}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <RefreshCw className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`} />
                </button>
                <span className="text-sm text-gray-400">{filteredUsers.length} user(s)</span>
              </div>
            </div>

            {/* Users table */}
            <div className="bg-white rounded-xl shadow-card border border-surface-border overflow-hidden">
              {usersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-surface-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">User</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Verified</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Photos</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Sales</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Joined</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {filteredUsers.map((user) => (
                        <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {user.avatarUrl ? (
                                <Image
                                  src={user.avatarUrl}
                                  alt={user.displayName || "User"}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-emerald-700">
                                    {(user.displayName || "?")[0]?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="font-medium text-gray-900">
                                {user.displayName || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{user.email || "—"}</td>
                          <td className="px-4 py-3">
                            <select
                              value={user.role}
                              onChange={(e) =>
                                changeUserRole(
                                  user.uid,
                                  e.target.value as "creator" | "buyer" | "admin"
                                )
                              }
                              className={`px-2 py-1 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${roleBadge(
                                user.role
                              )}`}
                            >
                              <option value="creator">Creator</option>
                              <option value="buyer">Buyer</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleVerified(user.uid, user.isVerified)}
                              className="flex items-center gap-1"
                              title={user.isVerified ? "Remove verification" : "Verify user"}
                            >
                              {user.isVerified ? (
                                <ToggleRight className="w-6 h-6 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-gray-300" />
                              )}
                              <span
                                className={`text-xs font-medium ${
                                  user.isVerified ? "text-emerald-600" : "text-gray-400"
                                }`}
                              >
                                {user.isVerified ? "Yes" : "No"}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{user.totalPhotos ?? 0}</td>
                          <td className="px-4 py-3 text-gray-700">{user.totalSales ?? 0}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setViewUser(user)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteUser(user.uid, user.displayName)}
                                className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* User Detail Modal */}
            {viewUser && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={() => setViewUser(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-900">User Details</h3>
                      <button
                        onClick={() => setViewUser(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      {viewUser.avatarUrl ? (
                        <Image
                          src={viewUser.avatarUrl}
                          alt={viewUser.displayName || "User"}
                          width={64}
                          height={64}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-emerald-700">
                            {(viewUser.displayName || "?")[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">
                          {viewUser.displayName || "Unknown"}
                        </h4>
                        <p className="text-sm text-gray-500">{viewUser.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${roleBadge(
                              viewUser.role
                            )}`}
                          >
                            {viewUser.role}
                          </span>
                          {viewUser.isVerified && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <UserCheck className="w-3 h-3 mr-1" /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">Total Photos</p>
                        <p className="text-lg font-bold text-gray-900">{viewUser.totalPhotos ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">Total Sales</p>
                        <p className="text-lg font-bold text-gray-900">{viewUser.totalSales ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">Wallet Points</p>
                        <p className="text-lg font-bold text-gray-900">{viewUser.walletPoints ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">Joined</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatDate(viewUser.createdAt)}
                        </p>
                      </div>
                    </div>
                    {viewUser.bio && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-400 mb-1">Bio</p>
                        <p className="text-sm text-gray-700">{viewUser.bio}</p>
                      </div>
                    )}
                    {viewUser.website && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1">Website</p>
                        <a
                          href={viewUser.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-600 hover:underline"
                        >
                          {viewUser.website}
                        </a>
                      </div>
                    )}
                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => {
                          deleteUser(viewUser.uid, viewUser.displayName);
                          setViewUser(null);
                        }}
                        className="px-4 py-2 rounded-xl font-medium text-red-600 hover:bg-red-50 border border-red-200 text-sm flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" /> Delete User
                      </button>
                      <button
                        onClick={() => setViewUser(null)}
                        className="px-4 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── LISTINGS TAB ──────────────────────────────────────────── */}
        {activeTab === "listings" && (
          <div>
            {/* Search bar */}
            <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border mb-6">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search listings by title, photographer, or category…"
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={fetchListings}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <RefreshCw className={`w-4 h-4 ${listingsLoading ? "animate-spin" : ""}`} />
                </button>
                <span className="text-sm text-gray-400">{filteredListings.length} listing(s)</span>
              </div>
            </div>

            {/* Listings table */}
            <div className="bg-white rounded-xl shadow-card border border-surface-border overflow-hidden">
              {listingsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No listings found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-surface-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Photo</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Owner</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Price</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Public</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Sales</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {filteredListings.map((listing) => (
                        <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                                {listing.thumbnailUrl || listing.imageUrl ? (
                                  <Image
                                    src={listing.thumbnailUrl || listing.imageUrl}
                                    alt={listing.title || "Photo"}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-gray-300" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate max-w-[180px]">
                                  {listing.title || "Untitled"}
                                </p>
                                <p className="text-xs text-gray-400">{formatDate(listing.createdAt)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-sm">
                            {listing.ownerName || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-sm capitalize">
                            {listing.category || "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-medium text-sm">
                            NPR {listing.priceNPR ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(
                                listing.status
                              )}`}
                            >
                              {listing.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-medium ${
                                listing.isPublic !== false
                                  ? "text-emerald-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {listing.isPublic !== false ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 text-sm">
                            {listing.salesCount ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(listing)}
                                className="p-1.5 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50"
                                title="Edit listing"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteListing(listing.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                                title="Delete listing"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Edit Listing Modal */}
            {editListing && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={() => setEditListing(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Edit Listing</h3>
                      <button
                        onClick={() => setEditListing(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Photo cannot be changed</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          Only listing metadata can be edited. The photo image itself cannot be replaced.
                        </p>
                      </div>
                    </div>

                    {/* Thumbnail preview */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                        {editListing.thumbnailUrl || editListing.imageUrl ? (
                          <Image
                            src={editListing.thumbnailUrl || editListing.imageUrl}
                            alt={editListing.title || "Photo"}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>By {editListing.ownerName || "Unknown"}</p>
                        <p className="text-xs">{formatDate(editListing.createdAt)}</p>
                      </div>
                    </div>

                    {/* Form fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, description: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price (NPR)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={editForm.priceNPR}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                priceNPR: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, category: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="">Select category</option>
                            {CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tags (comma separated)
                        </label>
                        <input
                          type="text"
                          value={editForm.tags}
                          onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))}
                          placeholder="nature, mountain, sunset"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                status: e.target.value as "pending" | "approved" | "rejected",
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Visibility
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((f) => ({ ...f, isPublic: !f.isPublic }))
                            }
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                              editForm.isPublic
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-gray-50 border-gray-200 text-gray-500"
                            }`}
                          >
                            {editForm.isPublic ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                            {editForm.isPublic ? "Public" : "Private"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={saveListingEdit}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 flex items-center gap-1.5 text-sm"
                      >
                        <Save className="w-4 h-4" /> Save Changes
                      </button>
                      <button
                        onClick={() => setEditListing(null)}
                        className="px-4 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 text-sm ml-auto"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── SALES TAB ─────────────────────────────────────────────── */}
        {activeTab === "sales" && (
          <div>
            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      NPR {totalSalesAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Purchases</p>
                    <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Toggle */}
            <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by buyer, seller, photo, payment method…"
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setSalesView("purchases")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      salesView === "purchases"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Purchases
                  </button>
                  <button
                    onClick={() => setSalesView("orders")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      salesView === "orders"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Orders
                  </button>
                </div>
                <button
                  onClick={fetchSales}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <RefreshCw className={`w-4 h-4 ${salesLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Purchases Table */}
            {salesView === "purchases" && (
              <div className="bg-white rounded-xl shadow-card border border-surface-border overflow-hidden">
                {salesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                  </div>
                ) : filteredPurchases.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No purchases found</p>
                    <p className="text-sm mt-1">No purchase records to display.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-surface-border">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">
                            <Hash className="w-4 h-4 inline mr-1" />ID
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Photo</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Buyer</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Seller</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Amount</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Payment</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {filteredPurchases.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-400 font-mono">
                                {p.id.slice(0, 8)}…
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                {p.photoTitle || p.photoId?.slice(0, 12) || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-700">
                                {p.buyerEmail || p.buyerId?.slice(0, 12) || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-700">
                                {p.sellerName || p.sellerId?.slice(0, 12) || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-bold text-emerald-700">
                                NPR {(p.amountNPR || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                <CreditCard className="w-3 h-3" />
                                {p.paymentMethod || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(
                                  p.status || "completed"
                                )}`}
                              >
                                {p.status || "completed"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {formatDateTime(p.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end">
                                <button
                                  onClick={() => deletePurchase(p.id)}
                                  className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                  title="Delete purchase"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Orders Table */}
            {salesView === "orders" && (
              <div className="bg-white rounded-xl shadow-card border border-surface-border overflow-hidden">
                {salesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <Receipt className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No orders found</p>
                    <p className="text-sm mt-1">No order records to display.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-surface-border">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Order ID</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Buyer</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Items</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Total</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Payment</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {filteredOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-400 font-mono">
                                {o.id.slice(0, 8)}…
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700 text-sm">
                              {o.buyerEmail || o.buyerId?.slice(0, 12) || "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-700 text-sm">
                              {o.items?.length || 0} item(s)
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-bold text-emerald-700">
                                NPR {(o.totalNPR || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                <CreditCard className="w-3 h-3" />
                                {o.paymentMethod || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(
                                  o.status
                                )}`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {formatDateTime(o.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setViewOrder(o)}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                  title="View order"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteOrder(o.id)}
                                  className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                  title="Delete order"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Order Detail Modal */}
            {viewOrder && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={() => setViewOrder(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
                      <button
                        onClick={() => setViewOrder(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-gray-400">Order ID</span>
                          <p className="font-mono text-gray-900 text-xs">{viewOrder.id}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Buyer</span>
                          <p className="font-medium text-gray-900">{viewOrder.buyerEmail}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Total</span>
                          <p className="font-bold text-emerald-700 text-lg">
                            NPR {(viewOrder.totalNPR || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Payment</span>
                          <p className="font-medium text-gray-900 capitalize">
                            {viewOrder.paymentMethod}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Status</span>
                          <p>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(
                                viewOrder.status
                              )}`}
                            >
                              {viewOrder.status}
                            </span>
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Date</span>
                          <p className="font-medium text-gray-900">
                            {formatDateTime(viewOrder.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <span className="text-gray-400 block mb-2">
                          Items ({viewOrder.items?.length || 0})
                        </span>
                        <div className="space-y-2">
                          {(viewOrder.items || []).map((item, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative">
                                {item.thumbnailUrl ? (
                                  <Image
                                    src={item.thumbnailUrl}
                                    alt={item.title || "Photo"}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {item.title || "Untitled"}
                                </p>
                              </div>
                              <span className="font-bold text-gray-900">
                                NPR {(item.priceNPR || 0).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => {
                          deleteOrder(viewOrder.id);
                          setViewOrder(null);
                        }}
                        className="px-4 py-2 rounded-xl font-medium text-red-600 hover:bg-red-50 border border-red-200 text-sm flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Order
                      </button>
                      <button
                        onClick={() => setViewOrder(null)}
                        className="px-4 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "ai-settings" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-600" />
                  AI System Management
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Configure API keys, models & settings for all AI services
                </p>
              </div>
              <button
                onClick={saveAISettings}
                disabled={aiSettingsSaving || aiSettingsLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                {aiSettingsSaving ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save All Settings</>
                )}
              </button>
            </div>

            {aiSettings?.updatedAt && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                Last updated: {new Date(aiSettings.updatedAt).toLocaleString()} by {aiSettings.updatedBy || "Admin"}
              </div>
            )}

            {aiSettingsLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : aiSettings ? (
              <div className="grid gap-6">
                {/* Photo Analysis AI */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Camera className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{aiSettings.photoAnalysis?.label || "Photo Analysis AI"}</h3>
                        <p className="text-xs text-gray-500">{aiSettings.photoAnalysis?.description || "Analyzes uploaded photos"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateAIService("photoAnalysis", "enabled", !aiSettings.photoAnalysis?.enabled)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        aiSettings.photoAnalysis?.enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {aiSettings.photoAnalysis?.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {aiSettings.photoAnalysis?.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Provider</label>
                      <select
                        value={aiSettings.photoAnalysis?.provider || "gemini"}
                        onChange={(e) => updateAIService("photoAnalysis", "provider", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI GPT</option>
                        <option value="claude">Anthropic Claude</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Model</label>
                      <select
                        value={aiSettings.photoAnalysis?.model || "gemini-2.0-flash"}
                        onChange={(e) => updateAIService("photoAnalysis", "model", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Fast &amp; Efficient)</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro (Most Capable)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Fast &amp; Smart)</option>
                        <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Lightweight)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">API Key</label>
                      <div className="flex gap-2">
                        <input
                          type={showApiKeys["photoAnalysis"] ? "text" : "password"}
                          value={aiSettings.photoAnalysis?.apiKey || ""}
                          onChange={(e) => updateAIService("photoAnalysis", "apiKey", e.target.value)}
                          placeholder="Enter API key..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => toggleApiKeyVisibility("photoAnalysis")}
                          className="px-3 py-2 border border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          {showApiKeys["photoAnalysis"] ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => testApiKey("photoAnalysis")}
                          disabled={apiKeyTestStatus["photoAnalysis"] === "testing" || !aiSettings.photoAnalysis?.apiKey}
                          className={`px-3 py-2 border rounded-xl text-xs font-medium transition-all ${
                            apiKeyTestStatus["photoAnalysis"] === "valid"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : apiKeyTestStatus["photoAnalysis"] === "invalid"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : apiKeyTestStatus["photoAnalysis"] === "testing"
                              ? "border-blue-300 bg-blue-50 text-blue-600"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {apiKeyTestStatus["photoAnalysis"] === "testing" ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : apiKeyTestStatus["photoAnalysis"] === "valid" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : apiKeyTestStatus["photoAnalysis"] === "invalid" ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            "Test"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chatbot AI */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{aiSettings.chatbot?.label || "Market Chatbot AI"}</h3>
                        <p className="text-xs text-gray-500">{aiSettings.chatbot?.description || "Customer support chatbot"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateAIService("chatbot", "enabled", !aiSettings.chatbot?.enabled)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        aiSettings.chatbot?.enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {aiSettings.chatbot?.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {aiSettings.chatbot?.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Provider</label>
                      <select
                        value={aiSettings.chatbot?.provider || "gemini"}
                        onChange={(e) => updateAIService("chatbot", "provider", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI GPT</option>
                        <option value="claude">Anthropic Claude</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Model</label>
                      <select
                        value={aiSettings.chatbot?.model || "gemini-2.0-flash"}
                        onChange={(e) => updateAIService("chatbot", "model", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Fast &amp; Efficient)</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro (Most Capable)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Fast &amp; Smart)</option>
                        <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Lightweight)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">API Key</label>
                      <div className="flex gap-2">
                        <input
                          type={showApiKeys["chatbot"] ? "text" : "password"}
                          value={aiSettings.chatbot?.apiKey || ""}
                          onChange={(e) => updateAIService("chatbot", "apiKey", e.target.value)}
                          placeholder="Enter API key..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => toggleApiKeyVisibility("chatbot")}
                          className="px-3 py-2 border border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          {showApiKeys["chatbot"] ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => testApiKey("chatbot")}
                          disabled={apiKeyTestStatus["chatbot"] === "testing" || !aiSettings.chatbot?.apiKey}
                          className={`px-3 py-2 border rounded-xl text-xs font-medium transition-all ${
                            apiKeyTestStatus["chatbot"] === "valid"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : apiKeyTestStatus["chatbot"] === "invalid"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : apiKeyTestStatus["chatbot"] === "testing"
                              ? "border-blue-300 bg-blue-50 text-blue-600"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {apiKeyTestStatus["chatbot"] === "testing" ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : apiKeyTestStatus["chatbot"] === "valid" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : apiKeyTestStatus["chatbot"] === "invalid" ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            "Test"
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">System Prompt</label>
                      <textarea
                        value={aiSettings.chatbot?.systemPrompt || ""}
                        onChange={(e) => updateAIService("chatbot", "systemPrompt", e.target.value)}
                        placeholder="Instructions for the chatbot..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Moderation AI */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{aiSettings.contentModeration?.label || "Content Moderation AI"}</h3>
                        <p className="text-xs text-gray-500">{aiSettings.contentModeration?.description || "Auto-screens uploads"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateAIService("contentModeration", "enabled", !aiSettings.contentModeration?.enabled)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        aiSettings.contentModeration?.enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {aiSettings.contentModeration?.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {aiSettings.contentModeration?.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Provider</label>
                      <select
                        value={aiSettings.contentModeration?.provider || "gemini"}
                        onChange={(e) => updateAIService("contentModeration", "provider", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI GPT</option>
                        <option value="claude">Anthropic Claude</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Model</label>
                      <select
                        value={aiSettings.contentModeration?.model || "gemini-2.0-flash"}
                        onChange={(e) => updateAIService("contentModeration", "model", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Fast &amp; Efficient)</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro (Most Capable)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Fast &amp; Smart)</option>
                        <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Lightweight)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">API Key</label>
                      <div className="flex gap-2">
                        <input
                          type={showApiKeys["contentModeration"] ? "text" : "password"}
                          value={aiSettings.contentModeration?.apiKey || ""}
                          onChange={(e) => updateAIService("contentModeration", "apiKey", e.target.value)}
                          placeholder="Enter API key..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => toggleApiKeyVisibility("contentModeration")}
                          className="px-3 py-2 border border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          {showApiKeys["contentModeration"] ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => testApiKey("contentModeration")}
                          disabled={apiKeyTestStatus["contentModeration"] === "testing" || !aiSettings.contentModeration?.apiKey}
                          className={`px-3 py-2 border rounded-xl text-xs font-medium transition-all ${
                            apiKeyTestStatus["contentModeration"] === "valid"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : apiKeyTestStatus["contentModeration"] === "invalid"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : apiKeyTestStatus["contentModeration"] === "testing"
                              ? "border-blue-300 bg-blue-50 text-blue-600"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {apiKeyTestStatus["contentModeration"] === "testing" ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : apiKeyTestStatus["contentModeration"] === "valid" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : apiKeyTestStatus["contentModeration"] === "invalid" ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            "Test"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEO & Description AI */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{aiSettings.seoOptimization?.label || "SEO & Description AI"}</h3>
                        <p className="text-xs text-gray-500">{aiSettings.seoOptimization?.description || "Generates SEO-optimized content"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateAIService("seoOptimization", "enabled", !aiSettings.seoOptimization?.enabled)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        aiSettings.seoOptimization?.enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {aiSettings.seoOptimization?.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {aiSettings.seoOptimization?.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Provider</label>
                      <select
                        value={aiSettings.seoOptimization?.provider || "gemini"}
                        onChange={(e) => updateAIService("seoOptimization", "provider", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI GPT</option>
                        <option value="claude">Anthropic Claude</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Model</label>
                      <select
                        value={aiSettings.seoOptimization?.model || "gemini-2.0-flash"}
                        onChange={(e) => updateAIService("seoOptimization", "model", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Fast &amp; Efficient)</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro (Most Capable)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Fast &amp; Smart)</option>
                        <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Lightweight)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">API Key</label>
                      <div className="flex gap-2">
                        <input
                          type={showApiKeys["seoOptimization"] ? "text" : "password"}
                          value={aiSettings.seoOptimization?.apiKey || ""}
                          onChange={(e) => updateAIService("seoOptimization", "apiKey", e.target.value)}
                          placeholder="Enter API key..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => toggleApiKeyVisibility("seoOptimization")}
                          className="px-3 py-2 border border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          {showApiKeys["seoOptimization"] ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => testApiKey("seoOptimization")}
                          disabled={apiKeyTestStatus["seoOptimization"] === "testing" || !aiSettings.seoOptimization?.apiKey}
                          className={`px-3 py-2 border rounded-xl text-xs font-medium transition-all ${
                            apiKeyTestStatus["seoOptimization"] === "valid"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : apiKeyTestStatus["seoOptimization"] === "invalid"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : apiKeyTestStatus["seoOptimization"] === "testing"
                              ? "border-blue-300 bg-blue-50 text-blue-600"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {apiKeyTestStatus["seoOptimization"] === "testing" ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : apiKeyTestStatus["seoOptimization"] === "valid" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : apiKeyTestStatus["seoOptimization"] === "invalid" ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            "Test"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">How API keys work</p>
                    <ul className="mt-1 space-y-1 text-blue-700">
                      <li>• API keys are stored securely in Firestore and used server-side only</li>
                      <li>• If no key is set here, the system falls back to environment variables</li>
                      <li>• You can change the AI provider and model without redeploying</li>
                      <li>• Disable a service to turn it off without deleting the key</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>Could not load AI settings. Try refreshing.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── UPLOAD PHOTO TAB ────────────────────────────────────── */}
        {activeTab === "upload" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Admin Upload</h2>
                  <p className="text-sm text-gray-500">Upload photos directly — auto-approved & published instantly</p>
                </div>
              </div>

              {/* Step: Select File */}
              {uploadStep === "select" && (
                <div
                  onClick={() => uploadFileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                >
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Click to select a photo</h3>
                  <p className="text-sm text-gray-500">JPG, PNG, WebP — Max 15MB</p>
                  <input
                    ref={uploadFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAdminFileSelect}
                  />
                </div>
              )}

              {/* Step: Analyzing */}
              {uploadStep === "analyzing" && (
                <div className="text-center py-16">
                  {uploadPreview && (
                    <div className="w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden shadow-lg">
                      <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Uploading & analyzing with AI...</p>
                </div>
              )}

              {/* Step: Edit Details */}
              {uploadStep === "edit" && (
                <div className="space-y-6">
                  {/* Preview */}
                  <div className="flex gap-6">
                    {uploadPreview && (
                      <div className="w-64 h-64 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                        <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 space-y-4">
                      {uploadAiError && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {uploadAiError}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                          type="text"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          placeholder="Photo title..."
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={uploadDescription}
                          onChange={(e) => setUploadDescription(e.target.value)}
                          rows={3}
                          placeholder="Describe the photo..."
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={uploadTagInput}
                        onChange={(e) => setUploadTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdminAddTag())}
                        placeholder="Add tag..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAdminAddTag}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {uploadTags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                          {tag}
                          <button onClick={() => setUploadTags(uploadTags.filter(t => t !== tag))} className="hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Category & Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR)</label>
                      <input
                        type="number"
                        value={uploadPrice}
                        onChange={(e) => setUploadPrice(Number(e.target.value))}
                        min={10}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAdminUploadSubmit}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Publish Photo
                    </button>
                    <button
                      onClick={handleAdminUploadReset}
                      className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Uploading */}
              {uploadStep === "uploading" && (
                <div className="text-center py-16">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Publishing photo...</p>
                </div>
              )}

              {/* Step: Done */}
              {uploadStep === "done" && (
                <div className="text-center py-16">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Photo Published! \ud83c\udf89</h3>
                  <p className="text-gray-500 mb-6">Your photo is live and visible to all users.</p>
                  <button
                    onClick={handleAdminUploadReset}
                    className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    Upload Another
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
