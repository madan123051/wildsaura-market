"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ImageIcon,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertTriangle,
  Home,
  RefreshCw,
  Star,
  CheckSquare,
  Square,
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  getCountFromServer,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import toast from "react-hot-toast";
import type { StockPhoto, UserProfile } from "@/types";

type TabKey = "pending" | "approved" | "rejected" | "all";

const TABS: { key: TabKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "pending", label: "Pending Review", icon: <Clock className="w-4 h-4" />, color: "text-yellow-600" },
  { key: "approved", label: "Approved", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-600" },
  { key: "rejected", label: "Rejected", icon: <XCircle className="w-4 h-4" />, color: "text-red-600" },
  { key: "all", label: "All Photos", icon: <ImageIcon className="w-4 h-4" />, color: "text-brand-dark" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  approved: "bg-green-100 text-green-800 border border-green-300",
  rejected: "bg-red-100 text-red-800 border border-red-300",
};

const DEMAND_BADGE: Record<string, string> = {
  High: "bg-emerald-100 text-emerald-700",
  Medium: "bg-blue-100 text-blue-700",
  Low: "bg-gray-100 text-gray-600",
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("pending");

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    totalSales: 0,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewPhoto, setPreviewPhoto] = useState<StockPhoto | null>(null);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setProfile(data);
            setIsAdmin(data.role === "admin");
          } else {
            setIsAdmin(false);
          }
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const photosRef = collection(db, "photos");
      const [totalSnap, pendingSnap, approvedSnap, allApprovedSnap] = await Promise.all([
        getCountFromServer(photosRef),
        getCountFromServer(query(photosRef, where("status", "==", "pending"))),
        getCountFromServer(query(photosRef, where("status", "==", "approved"))),
        getDocs(query(photosRef, where("status", "==", "approved"))),
      ]);

      let totalSales = 0;
      allApprovedSnap.forEach((d) => {
        const photo = d.data() as StockPhoto;
        totalSales += photo.salesCount || 0;
      });

      setStats({
        total: totalSnap.data().count,
        pending: pendingSnap.data().count,
        approved: approvedSnap.data().count,
        totalSales,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  // Fetch photos for active tab
  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const photosRef = collection(db, "photos");
      let q;
      if (activeTab === "all") {
        q = query(photosRef, orderBy("createdAt", "desc"));
      } else {
        q = query(photosRef, where("status", "==", activeTab), orderBy("createdAt", "desc"));
      }
      const snap = await getDocs(q);
      const results: StockPhoto[] = [];
      snap.forEach((d) => {
        results.push({ id: d.id, ...d.data() } as StockPhoto);
      });
      setPhotos(results);
    } catch (err) {
      console.error("Failed to fetch photos:", err);
      toast.error("Failed to load photos");
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchPhotos();
    }
  }, [isAdmin, fetchStats, fetchPhotos]);

  // Actions
  const setPhotoActionLoading = (id: string, loading: boolean) => {
    setActionLoading((prev) => {
      const next = new Set(prev);
      if (loading) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleApprove = async (photoId: string) => {
    setPhotoActionLoading(photoId, true);
    try {
      await updateDoc(doc(db, "photos", photoId), {
        status: "approved",
        isPublic: true,
      });
      toast.success("Photo approved");
      fetchPhotos();
      fetchStats();
    } catch {
      toast.error("Failed to approve photo");
    }
    setPhotoActionLoading(photoId, false);
  };

  const handleReject = async (photoId: string) => {
    setPhotoActionLoading(photoId, true);
    try {
      await updateDoc(doc(db, "photos", photoId), {
        status: "rejected",
        isPublic: false,
      });
      toast.success("Photo rejected");
      fetchPhotos();
      fetchStats();
    } catch {
      toast.error("Failed to reject photo");
    }
    setPhotoActionLoading(photoId, false);
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    toast.loading(`Approving ${ids.length} photos...`, { id: "bulk" });
    try {
      await Promise.all(
        ids.map((id) =>
          updateDoc(doc(db, "photos", id), { status: "approved", isPublic: true })
        )
      );
      toast.success(`${ids.length} photos approved`, { id: "bulk" });
      fetchPhotos();
      fetchStats();
    } catch {
      toast.error("Bulk approve failed", { id: "bulk" });
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    toast.loading(`Rejecting ${ids.length} photos...`, { id: "bulk" });
    try {
      await Promise.all(
        ids.map((id) =>
          updateDoc(doc(db, "photos", id), { status: "rejected", isPublic: false })
        )
      );
      toast.success(`${ids.length} photos rejected`, { id: "bulk" });
      fetchPhotos();
      fetchStats();
    } catch {
      toast.error("Bulk reject failed", { id: "bulk" });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    }
  };

  const formatDate = (date: Date | { seconds: number } | string) => {
    let d: Date;
    if (date && typeof date === "object" && "seconds" in date) {
      d = new Date(date.seconds * 1000);
    } else {
      d = new Date(date as string);
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // --- RENDERS ---

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
          <p className="text-gray-500 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="bg-white rounded-2xl shadow-card p-10 text-center max-w-md">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-brand-dark mb-2">Authentication Required</h1>
          <p className="text-gray-500 mb-6">Please log in to access the admin panel.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-primary/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="bg-white rounded-2xl shadow-card p-10 text-center max-w-md">
          <ShieldX className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-brand-dark mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">You don&apos;t have admin privileges to access this page.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Header */}
      <div className="bg-white border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary/10 rounded-xl">
                <ShieldCheck className="w-7 h-7 text-brand-primary" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-brand-dark">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Photo moderation & management</p>
              </div>
            </div>
            <button
              onClick={() => {
                fetchStats();
                fetchPhotos();
              }}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-primary px-4 py-2 rounded-lg border border-surface-border hover:border-brand-primary/30 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Total Photos</span>
              <div className="p-2 bg-blue-50 rounded-lg">
                <ImageIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-brand-dark">{stats.total.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Pending Review</span>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Approved</span>
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.approved.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Total Sales</span>
              <div className="p-2 bg-purple-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.totalSales.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-card border border-surface-border overflow-hidden">
          <div className="flex items-center border-b border-surface-border overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? `${tab.color} border-current bg-gray-50/50`
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50/50"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.key === "pending" && stats.pending > 0 && (
                  <span className="ml-1 bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {stats.pending > 99 ? "99+" : stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="px-5 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-4">
              <span className="text-sm font-medium text-blue-800">
                {selectedIds.size} photo{selectedIds.size > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkApprove}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve All
                </button>
                <button
                  onClick={handleBulkReject}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject All
                </button>
              </div>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-auto text-xs text-blue-600 hover:underline"
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-surface-border">
            <div className="col-span-1 flex items-center">
              <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                {selectedIds.size === photos.length && photos.length > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="col-span-3">Photo</div>
            <div className="col-span-2">Photographer</div>
            <div className="col-span-1">Category</div>
            <div className="col-span-1">Quality</div>
            <div className="col-span-1">Demand</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
              <p className="text-sm text-gray-500">Loading photos...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <ImageIcon className="w-12 h-12 text-gray-300" />
              <p className="text-gray-500 font-medium">No photos found</p>
              <p className="text-sm text-gray-400">
                {activeTab === "pending"
                  ? "No photos pending review"
                  : `No ${activeTab} photos`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-gray-50/50 transition-colors ${
                    selectedIds.has(photo.id) ? "bg-blue-50/40" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <div className="hidden lg:flex col-span-1 items-center">
                    <button onClick={() => toggleSelect(photo.id)} className="text-gray-400 hover:text-gray-600">
                      {selectedIds.has(photo.id) ? (
                        <CheckSquare className="w-4 h-4 text-brand-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Photo Info */}
                  <div className="lg:col-span-3 flex items-center gap-3">
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={photo.thumbnailUrl || photo.imageUrl}
                        alt={photo.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-dark truncate">{photo.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(photo.createdAt)}</p>
                    </div>
                  </div>

                  {/* Photographer */}
                  <div className="lg:col-span-2 flex items-center gap-2">
                    {photo.ownerAvatar && (
                      <Image
                        src={photo.ownerAvatar}
                        alt={photo.ownerName || ""}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-sm text-gray-700 truncate">
                      {photo.ownerName || "Unknown"}
                    </span>
                  </div>

                  {/* Category */}
                  <div className="lg:col-span-1">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md capitalize">
                      {photo.category}
                    </span>
                  </div>

                  {/* Quality Score */}
                  <div className="lg:col-span-1">
                    {photo.qualityScore != null ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-brand-secondary fill-brand-secondary" />
                        <span className="text-sm font-medium text-gray-700">
                          {photo.qualityScore}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </div>

                  {/* Market Demand */}
                  <div className="lg:col-span-1">
                    {photo.marketDemand ? (
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-md ${
                          DEMAND_BADGE[photo.marketDemand] || ""
                        }`}
                      >
                        {photo.marketDemand}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="lg:col-span-1">
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                        STATUS_BADGE[photo.status] || ""
                      }`}
                    >
                      {photo.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2 flex items-center justify-end gap-2">
                    {/* Preview */}
                    <button
                      onClick={() => setPreviewPhoto(photo)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Approve (show on pending & rejected) */}
                    {(photo.status === "pending" || photo.status === "rejected") && (
                      <button
                        onClick={() => handleApprove(photo.id)}
                        disabled={actionLoading.has(photo.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        title={photo.status === "rejected" ? "Re-approve" : "Approve"}
                      >
                        {actionLoading.has(photo.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Reject (show on pending & approved) */}
                    {(photo.status === "pending" || photo.status === "approved") && (
                      <button
                        onClick={() => handleReject(photo.id)}
                        disabled={actionLoading.has(photo.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        {actionLoading.has(photo.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <div>
                <h3 className="font-heading text-lg font-bold text-brand-dark">
                  {previewPhoto.title}
                </h3>
                <p className="text-sm text-gray-500">by {previewPhoto.ownerName || "Unknown"}</p>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="relative w-full aspect-[4/3] bg-gray-100">
              <Image
                src={previewPhoto.imageUrl}
                alt={previewPhoto.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                    STATUS_BADGE[previewPhoto.status]
                  }`}
                >
                  {previewPhoto.status}
                </span>
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full capitalize">
                  {previewPhoto.category}
                </span>
                {previewPhoto.marketDemand && (
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      DEMAND_BADGE[previewPhoto.marketDemand]
                    }`}
                  >
                    {previewPhoto.marketDemand} Demand
                  </span>
                )}
              </div>
              {previewPhoto.description && (
                <p className="text-sm text-gray-600">{previewPhoto.description}</p>
              )}
              {previewPhoto.tags && previewPhoto.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {previewPhoto.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-brand-light text-brand-primary px-2 py-0.5 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                <span className="text-lg font-bold text-brand-dark">
                  NPR {previewPhoto.priceNPR?.toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  {(previewPhoto.status === "pending" || previewPhoto.status === "rejected") && (
                    <button
                      onClick={() => {
                        handleApprove(previewPhoto.id);
                        setPreviewPhoto(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {previewPhoto.status === "rejected" ? "Re-approve" : "Approve"}
                    </button>
                  )}
                  {(previewPhoto.status === "pending" || previewPhoto.status === "approved") && (
                    <button
                      onClick={() => {
                        handleReject(previewPhoto.id);
                        setPreviewPhoto(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
