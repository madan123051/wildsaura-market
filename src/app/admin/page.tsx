"use client";

import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  getCountFromServer,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
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
} from "lucide-react";

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

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
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

type TabKey = "photos" | "users" | "listings" | "stats";
type PhotoFilter = "all" | "pending" | "approved" | "rejected";

interface PurchaseRecord {
  id: string;
  photoId: string;
  buyerId: string;
  sellerId: string;
  amountNPR: number;
  createdAt: Timestamp | null;
}

interface StatData {
  totalPhotos: number;
  totalUsers: number;
  totalRevenue: number;
  totalPurchases: number;
  categoryBreakdown: { category: string; count: number }[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  // Auth state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<TabKey>("photos");

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

  // Stats tab
  const [stats, setStats] = useState<StatData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ─── Auth Check ────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setIsAdmin(data.role === "admin");
          } else {
            setIsAdmin(false);
          }
        } catch {
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
      let q;
      if (photoFilter === "all") {
        q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
      } else {
        q = query(
          collection(db, "photos"),
          where("status", "==", photoFilter),
          orderBy("createdAt", "desc")
        );
      }
      const snap = await getDocs(q);
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

  // ─── Fetch Stats ──────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Counts
      const photosSnap = await getCountFromServer(collection(db, "photos"));
      const usersSnap = await getCountFromServer(collection(db, "users"));
      const purchasesSnap = await getCountFromServer(collection(db, "purchases"));

      const pendingSnap = await getCountFromServer(
        query(collection(db, "photos"), where("status", "==", "pending"))
      );
      const approvedSnap = await getCountFromServer(
        query(collection(db, "photos"), where("status", "==", "approved"))
      );
      const rejectedSnap = await getCountFromServer(
        query(collection(db, "photos"), where("status", "==", "rejected"))
      );

      // Revenue from purchases
      const purchasesDocs = await getDocs(collection(db, "purchases"));
      let totalRevenue = 0;
      purchasesDocs.forEach((d) => {
        const data = d.data() as PurchaseRecord;
        totalRevenue += data.amountNPR || 0;
      });

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
        categoryBreakdown,
        pendingCount: pendingSnap.data().count,
        approvedCount: approvedSnap.data().count,
        rejectedCount: rejectedSnap.data().count,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      toast.error("Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === "stats") {
      fetchStats();
    }
  }, [isAdmin, activeTab, fetchStats]);

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
          <p className="text-gray-500">You must be logged in as an admin to view this page.</p>
        </div>
      </div>
    );
  }

  // ─── Tab Config ───────────────────────────────────────────────────────────

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "photos", label: "Photos", icon: <Camera className="w-4 h-4" /> },
    { key: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { key: "listings", label: "Listings", icon: <ListChecks className="w-4 h-4" /> },
    { key: "stats", label: "Stats", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Manage photos, users, listings &amp; stats</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-surface-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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
        {/* ─── PHOTOS TAB ────────────────────────────────────────────── */}
        {activeTab === "photos" && (
          <div>
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Filter:</span>
                  {(["pending", "approved", "rejected", "all"] as PhotoFilter[]).map((f) => (
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
                    Bulk Approve ({selectedPhotoIds.size})
                  </button>
                  <button
                    onClick={() => bulkUpdateStatus("rejected")}
                    disabled={selectedPhotoIds.size === 0}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Bulk Reject ({selectedPhotoIds.size})
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
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Quality</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Demand</th>
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
                            <span className="text-gray-600 text-sm">{photo.category || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-500" />
                              <span className="text-sm text-gray-700">
                                {photo.qualityScore ?? photo.aiQualityScore ?? "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-sm text-gray-700">
                                {photo.marketDemand ?? "—"}
                              </span>
                            </div>
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
                        <p className="font-medium text-gray-900">{previewPhoto.category || "—"}</p>
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
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => setViewUser(user)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
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
                    <div className="mt-6 flex justify-end">
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
                          <td className="px-4 py-3 text-gray-600 text-sm">
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

                    {/* Warning: photo cannot be changed */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Photo cannot be changed</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          Only listing metadata (title, description, price, category, tags, status, visibility) can be edited. The photo image itself cannot be replaced.
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
                              <option key={cat} value={cat}>
                                {cat}
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

        {/* ─── STATS TAB ─────────────────────────────────────────────── */}
        {activeTab === "stats" && (
          <div>
            {statsLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <p className="text-sm text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          NPR {stats.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-purple-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Purchases</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photo Status Breakdown */}
                <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Photo Status Breakdown</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 text-center">
                      <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-800">{stats.pendingCount}</p>
                      <p className="text-xs text-yellow-600 font-medium">Pending</p>
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
                              <span className="text-sm font-medium text-gray-700">{cat.category}</span>
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
      </div>
    </div>
  );
}
