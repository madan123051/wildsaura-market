"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  ShoppingBag,
  Heart,
  Eye,
  Search,
  Package,
  PauseCircle,
  PlayCircle,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  ImageIcon,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  Tag,
  DollarSign,
  FileText,
  FileArchive,
  AlertCircle,
  Camera,
  Upload,
  Coins,
  Gift,
  Copy,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES } from "@/types";
import type { PhotoCategory } from "@/types";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  limit,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ref, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { MAX_WILDSAURA_POINTS } from "@/lib/rewards";
import type { EquipmentListing, StockPhoto } from "@/types";
import toast from "react-hot-toast";

interface PurchaseRecord {
  id: string;
  photoId: string;
  photoTitle: string;
  photoUrl: string;
  price: number;
  purchasedAt: Date;
  status: "completed" | "pending" | "failed";
}

interface BuyerOrderItem {
  itemType?: "photo" | "equipment";
  photoId?: string;
  equipmentId?: string;
  title: string;
  thumbnailUrl: string;
  priceNPR: number;
  ownerName?: string;
  sellerName?: string;
  trackingStatus?: string;
}

interface BuyerOrder {
  id: string;
  items: BuyerOrderItem[];
  totalNPR: number;
  status: string;
  paymentMethod: string;
  paymentStatus?: string;
  trackingStatus?: string;
  transactionRef?: string;
  createdAt: Date;
  paidAt?: Date;
}

interface PointTransaction {
  id: string;
  type: string;
  title: string;
  description?: string;
  points: number;
  balanceAfter?: number;
  createdAt: Date;
}

type TabKey = "overview" | "listings" | "equipment" | "purchases" | "downloads" | "points" | "favorites";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  approved: "bg-green-100 text-green-800 border border-green-300",
  rejected: "bg-red-100 text-red-800 border border-red-300",
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<BuyerOrder[]>([]);
  const [downloads, setDownloads] = useState<StockPhoto[]>([]);
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [favorites, setFavorites] = useState<StockPhoto[]>([]);
  const [myListings, setMyListings] = useState<StockPhoto[]>([]);
  const [myEquipmentListings, setMyEquipmentListings] = useState<EquipmentListing[]>([]);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalDownloads: 0,
    totalSpent: 0,
    favoriteCount: 0,
    myListingsCount: 0,
    myEquipmentListingsCount: 0,
  });

  const tabFromUrl = searchParams.get("tab") as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(tabFromUrl || "overview");
  const [dataLoading, setDataLoading] = useState(true);

  // Edit modal state
  const [editingPhoto, setEditingPhoto] = useState<StockPhoto | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editCategory, setEditCategory] = useState<PhotoCategory>("nature");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingEquipmentId, setUpdatingEquipmentId] = useState<string | null>(null);
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (tabFromUrl && ["overview", "listings", "equipment", "purchases", "downloads", "points", "favorites"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setDataLoading(true);
      try {
        // Fetch purchases
        const purchasesRef = collection(db, "purchases");
        const purchasesQuery = query(
          purchasesRef,
          where("buyerId", "==", user.uid),
          limit(20)
        );
        const purchasesSnap = await getDocs(purchasesQuery);
        const purchasesList = purchasesSnap.docs
          .map((purchaseDoc) => {
            const data = purchaseDoc.data();
            return {
              id: purchaseDoc.id,
              ...data,
              price: Number(data.price || data.amountNPR || 0),
              purchasedAt: data.purchasedAt?.toDate() || new Date(),
            };
          })
          .sort((a: any, b: any) => b.purchasedAt - a.purchasedAt) as PurchaseRecord[];
        setPurchases(purchasesList);

        // Fetch buyer orders for payment + equipment tracking.
        const ordersRef = collection(db, "orders");
        const ordersQuery = query(
          ordersRef,
          where("buyerId", "==", user.uid),
          limit(30)
        );
        const ordersSnap = await getDocs(ordersQuery);
        const buyerOrderList = ordersSnap.docs
          .map((orderDoc) => {
            const data = orderDoc.data();
            return {
              id: orderDoc.id,
              items: data.items || [],
              totalNPR: data.totalNPR || 0,
              status: data.status || "pending",
              paymentMethod: data.paymentMethod || "",
              paymentStatus: data.paymentStatus,
              trackingStatus: data.trackingStatus,
              transactionRef: data.transactionRef,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              paidAt: data.paidAt?.toDate?.(),
            } as BuyerOrder;
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setBuyerOrders(buyerOrderList);

        // Fetch downloads
        const downloadsRef = collection(db, "downloads");
        const downloadsQuery = query(
          downloadsRef,
          where("buyerId", "==", user.uid),
          limit(20)
        );
        const downloadsSnap = await getDocs(downloadsQuery);
        const downloadIds = downloadsSnap.docs.map((doc) => doc.data().photoId);

        if (downloadIds.length > 0) {
          const photosRef = collection(db, "photos");
          const photosQuery = query(
            photosRef,
            where("__name__", "in", downloadIds.slice(0, 10))
          );
          const photosSnap = await getDocs(photosQuery);
          setDownloads(
            photosSnap.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as StockPhoto)
            )
          );
        }

        // Fetch favorites
        const favRef = collection(db, "favorites");
        const favQuery = query(
          favRef,
          where("userId", "==", user.uid),
          limit(20)
        );
        const favSnap = await getDocs(favQuery);
        const favPhotoIds = favSnap.docs.map((doc) => doc.data().photoId);

        if (favPhotoIds.length > 0) {
          const favPhotosRef = collection(db, "photos");
          const favPhotosQuery = query(
            favPhotosRef,
            where("__name__", "in", favPhotoIds.slice(0, 10))
          );
          const favPhotosSnap = await getDocs(favPhotosQuery);
          setFavorites(
            favPhotosSnap.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as StockPhoto)
            )
          );
        }

        // Fetch points balance + history
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const profilePoints = Number(userSnap.data()?.walletPoints || 0);
        setUserPoints(profilePoints);

        const pointsQuery = query(
          collection(db, "pointTransactions"),
          where("userId", "==", user.uid),
          limit(50)
        );
        const pointsSnap = await getDocs(pointsQuery);
        const pointList = pointsSnap.docs
          .map((pointDoc) => {
            const data = pointDoc.data();
            return {
              id: pointDoc.id,
              type: data.type || "",
              title: data.title || "Points earned",
              description: data.description,
              points: Number(data.points || 0),
              balanceAfter: data.balanceAfter,
              createdAt: data.createdAt?.toDate?.() || new Date(),
            } as PointTransaction;
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const latestBalance = pointList.find(
          (item) => typeof item.balanceAfter === "number"
        )?.balanceAfter;
        const hasMatchingDebit = pointList.some(
          (item) => item.points < 0 && item.balanceAfter === profilePoints
        );

        if (
          typeof latestBalance === "number" &&
          profilePoints < latestBalance &&
          !hasMatchingDebit
        ) {
          setPointHistory([
            {
              id: "recovered-points-spend",
              type: "purchase_spend",
              title: "Points used",
              description: `${latestBalance - profilePoints} points were used from your wallet.`,
              points: profilePoints - latestBalance,
              balanceAfter: profilePoints,
              createdAt: new Date(),
            },
            ...pointList,
          ]);
        } else {
          setPointHistory(pointList);
        }

        // Fetch MY LISTINGS
        const myPhotosRef = collection(db, "photos");
        const myPhotosQuery = query(
          myPhotosRef,
          where("ownerId", "==", user.uid)
        );
        const myPhotosSnap = await getDocs(myPhotosQuery);
        const myPhotosList = myPhotosSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as StockPhoto))
          .sort((a: any, b: any) => {
            const aDate = a.createdAt?.toDate?.() ?? a.createdAt ?? new Date(0);
            const bDate = b.createdAt?.toDate?.() ?? b.createdAt ?? new Date(0);
            return bDate - aDate;
          });
        setMyListings(myPhotosList);

        // Fetch MY EQUIPMENT LISTINGS
        const myEquipmentRef = collection(db, "equipmentListings");
        const myEquipmentQuery = query(
          myEquipmentRef,
          where("sellerId", "==", user.uid)
        );
        const myEquipmentSnap = await getDocs(myEquipmentQuery);
        const myEquipmentList = myEquipmentSnap.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
          } as EquipmentListing))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setMyEquipmentListings(myEquipmentList);

        // Calculate stats
        const paidBuyerOrders = buyerOrderList.filter(
          (order) =>
            order.status === "paid" ||
            order.paymentStatus === "verified" ||
            order.paymentStatus === "paid"
        );
        const completedPurchases = purchasesList.filter(
          (purchase) => purchase.status === "completed"
        );
        const orderTotalSpent = paidBuyerOrders.reduce((sum, order) => sum + (order.totalNPR || 0), 0);
        setStats({
          totalPurchases: paidBuyerOrders.length || completedPurchases.length,
          totalDownloads: downloadsSnap.docs.length,
          totalSpent: orderTotalSpent || completedPurchases.reduce((sum, p) => sum + (p.price || 0), 0),
          favoriteCount: favSnap.docs.length,
          myListingsCount: myPhotosList.length,
          myEquipmentListingsCount: myEquipmentList.length,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load your listings. Please refresh.");
      } finally {
        setDataLoading(false);
      }
    }

    fetchData();
  }, [user, searchParams]);

  // ─── Open Edit Modal ────────────────────────────────────
  const openEditModal = (photo: StockPhoto) => {
    setEditingPhoto(photo);
    setEditTitle(photo.title);
    setEditDescription(photo.description || "");
    setEditPrice(photo.priceNPR);
    setEditCategory(photo.category);
    setEditTags(photo.tags || []);
    setEditTagInput("");
  };

  // ─── Save Edit ──────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editingPhoto) return;
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (editPrice < 10) {
      toast.error("Minimum price is NPR 10");
      return;
    }

    setEditSaving(true);
    try {
      await updateDoc(doc(db, "photos", editingPhoto.id), {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priceNPR: editPrice,
        category: editCategory,
        tags: editTags,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setMyListings((prev) =>
        prev.map((p) =>
          p.id === editingPhoto.id
            ? {
                ...p,
                title: editTitle.trim(),
                description: editDescription.trim(),
                priceNPR: editPrice,
                category: editCategory,
                tags: editTags,
              }
            : p
        )
      );

      toast.success("Listing updated! ✨");
      setEditingPhoto(null);
    } catch (err) {
      console.error("Edit error:", err);
      toast.error("Failed to update listing");
    } finally {
      setEditSaving(false);
    }
  };

  // ─── Delete Listing ─────────────────────────────────────
  const handleDelete = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this listing? This cannot be undone.")) return;

    setDeletingId(photoId);
    try {
      const photo = myListings.find((p) => p.id === photoId);

      // Delete from Firestore
      await deleteDoc(doc(db, "photos", photoId));

      // Try to delete from Storage (best effort)
      if (photo?.imageUrl) {
        try {
          const storageRef = ref(storage, photo.imageUrl);
          await deleteObject(storageRef);
        } catch {
          // Image may not exist or URL format may differ, that's OK
        }
      }

      setMyListings((prev) => prev.filter((p) => p.id !== photoId));
      setStats((prev) => ({ ...prev, myListingsCount: prev.myListingsCount - 1 }));
      toast.success("Listing deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete listing");
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Update Equipment Status ───────────────────────────────
  const handleEquipmentStatus = async (listingId: string, status: EquipmentListing["status"]) => {
    setUpdatingEquipmentId(listingId);
    try {
      await updateDoc(doc(db, "equipmentListings", listingId), {
        status,
        updatedAt: serverTimestamp(),
      });
      setMyEquipmentListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId ? { ...listing, status, updatedAt: new Date() } : listing
        )
      );
      toast.success(status === "sold" ? "Listing marked sold" : status === "inactive" ? "Listing paused" : "Listing activated");
    } catch (err) {
      console.error("Equipment status error:", err);
      toast.error("Failed to update equipment listing");
    } finally {
      setUpdatingEquipmentId(null);
    }
  };

  // ─── Delete Equipment Listing ───────────────────────────────
  const handleDeleteEquipment = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this equipment listing? This cannot be undone.")) return;

    setUpdatingEquipmentId(listingId);
    try {
      await deleteDoc(doc(db, "equipmentListings", listingId));
      setMyEquipmentListings((prev) => prev.filter((listing) => listing.id !== listingId));
      setStats((prev) => ({ ...prev, myEquipmentListingsCount: Math.max(0, prev.myEquipmentListingsCount - 1) }));
      toast.success("Equipment listing deleted");
    } catch (err) {
      console.error("Equipment delete error:", err);
      toast.error("Failed to delete equipment listing");
    } finally {
      setUpdatingEquipmentId(null);
    }
  };

  const formatDate = (date: Date | { seconds: number } | string | undefined) => {
    if (!date) return "";
    let d: Date;
    if (typeof date === "object" && "seconds" in date) {
      d = new Date(date.seconds * 1000);
    } else {
      d = new Date(date as string);
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleDownloadPhoto = async (photo: StockPhoto) => {
    if (!user) {
      toast.error("Please log in to download");
      return;
    }

    setDownloadingPhotoId(photo.id);
    toast.loading("Preparing licensed download...", { id: `download-${photo.id}` });

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/download/${photo.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || "Download failed", { id: `download-${photo.id}` });
        return;
      }

      const licenseCode = res.headers.get("X-License-Code");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?(.+?)"?$/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `WildSaura_${photo.title || "photo"}.zip`;

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success(
        licenseCode ? `Download started. License: ${licenseCode}` : "Download started!",
        { id: `download-${photo.id}`, duration: 6000 }
      );
    } catch (error) {
      console.error("Dashboard download error:", error);
      toast.error("Download failed. Please try again.", { id: `download-${photo.id}` });
    } finally {
      setDownloadingPhotoId(null);
    }
  };

  const orderStatusMeta = (order: BuyerOrder) => {
    if (order.status === "paid") {
      return { label: "Paid", className: "bg-green-100 text-green-800", icon: CheckCircle };
    }
    if (order.status === "failed" || order.paymentStatus === "failed") {
      return { label: "Payment Failed", className: "bg-red-100 text-red-800", icon: XCircle };
    }
    if (order.paymentMethod === "cash_on_delivery") {
      return { label: "Order Placed", className: "bg-blue-100 text-blue-800", icon: Package };
    }
    return { label: "Awaiting Payment", className: "bg-yellow-100 text-yellow-800", icon: Clock };
  };

  const itemTrackingLabel = (item: BuyerOrderItem, order: BuyerOrder) => {
    if (item.itemType === "equipment") {
      if (order.status === "paid") return "Paid - seller will arrange handover";
      if (order.paymentMethod === "cash_on_delivery") return "Reserved - pay seller on delivery/meet-up";
      return "Waiting for payment";
    }
    if (order.status === "paid") return "Ready for licensed download";
    return "Waiting for payment";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!user) return null;
  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/login?ref=${user.uid}`
    : "";
  const pointProgress = Math.min(100, Math.round((userPoints / MAX_WILDSAURA_POINTS) * 100));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back{user.displayName ? `, ${user.displayName}` : ""} 👋
            </h1>
            <p className="text-gray-500 mt-1">
              Manage photo sales, equipment listings, purchases and downloads
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              Browse Photos
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Sell Photo
            </Link>
            <Link
              href="/shopping/sell"
              className="inline-flex items-center gap-2 border border-blue-200 text-blue-700 px-5 py-2.5 rounded-xl font-medium hover:bg-blue-50 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Sell Equipment
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">My Listings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.myListingsCount}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Purchases</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalPurchases}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-500">Downloads</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalDownloads}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-gray-500">Points</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {userPoints}/250
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Total Spent</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              Rs. {stats.totalSpent}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-sm text-gray-500">Favorites</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.favoriteCount}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {([
            { id: "overview" as const, label: "Overview", icon: Eye },
            { id: "listings" as const, label: "Photo Listings", icon: ImageIcon },
            { id: "equipment" as const, label: "My Equipment Listings", icon: Package },
            { id: "purchases" as const, label: "Orders & Tracking", icon: ShoppingBag },
            { id: "downloads" as const, label: "Downloads", icon: Download },
            { id: "points" as const, label: "Points", icon: Coins },
            { id: "favorites" as const, label: "Favorites", icon: Heart },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "listings" && stats.myListingsCount > 0 && (
                <span className="ml-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-2 py-0.5">
                  {stats.myListingsCount}
                </span>
              )}
              {tab.id === "equipment" && stats.myEquipmentListingsCount > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full px-2 py-0.5">
                  {stats.myEquipmentListingsCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          {dataLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading your data...</p>
            </div>
          ) : activeTab === "overview" ? (
            <div className="p-6">
              {/* Primary Seller Actions */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <Link
                  href="/explore"
                  className="flex items-center gap-3 p-4 rounded-xl border border-emerald-100 bg-emerald-50 hover:border-emerald-300 transition-colors"
                >
                  <Search className="w-8 h-8 text-emerald-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Browse Photos</h4>
                    <p className="text-sm text-gray-500">Discover and license WildSaura photos</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
                <Link
                  href="/upload"
                  className="flex items-center gap-3 p-4 rounded-xl border border-emerald-100 bg-emerald-50 hover:border-emerald-300 transition-colors"
                >
                  <Camera className="w-8 h-8 text-emerald-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Sell Photo</h4>
                    <p className="text-sm text-gray-500">Upload and sell your photography</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
                <Link
                  href="/shopping/sell"
                  className="flex items-center gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <Package className="w-8 h-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Sell Equipment</h4>
                    <p className="text-sm text-gray-500">List cameras, lenses & gear on WildSaura Market</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
              </div>

              {/* Quick Actions */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <Link
                  href="/shopping"
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
                >
                  <ShoppingBag className="w-8 h-8 text-emerald-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Shop Equipment</h4>
                    <p className="text-sm text-gray-500">
                      Browse cameras, lenses and gear
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
                <Link
                  href="/downloads"
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <Download className="w-8 h-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">My Downloads</h4>
                    <p className="text-sm text-gray-500">
                      Access purchased photos
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
                <Link
                  href="/upload"
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors"
                >
                  <Camera className="w-8 h-8 text-orange-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Sell a Photo</h4>
                    <p className="text-sm text-gray-500">
                      Upload and sell your photography
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
              </div>

              {/* Recent Listings */}
              {myListings.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      My Recent Photo Listings
                    </h3>
                    <button
                      onClick={() => setActiveTab("listings")}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {myListings.slice(0, 4).map((photo) => (
                      <div key={photo.id} className="rounded-xl overflow-hidden border border-gray-100">
                        <div className="aspect-[4/3] relative">
                          <Image
                            src={photo.thumbnailUrl || photo.imageUrl}
                            alt={photo.title}
                            fill
                            className="object-cover"
                          />
                          <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[photo.status] || ""}`}>
                            {photo.status}
                          </span>
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-gray-900 text-sm truncate">{photo.title}</p>
                          <p className="text-sm text-emerald-600">Rs. {photo.priceNPR}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Recent Purchases */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Purchases
              </h3>
              {purchases.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No purchases yet</p>
                  <Link
                    href="/explore"
                    className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  >
                    Browse photos to get started →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchases.slice(0, 5).map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {purchase.photoUrl && (
                          <Image
                            src={purchase.photoUrl}
                            alt={purchase.photoTitle}
                            width={64}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {purchase.photoTitle}
                        </p>
                        <p className="text-sm text-gray-500">
                          {purchase.purchasedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {purchase.status === "completed" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : purchase.status === "failed" ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className="font-medium text-gray-900">
                          Rs. {purchase.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          ) : activeTab === "listings" ? (
            /* ─── MY PHOTO LISTINGS TAB ─────────────────────── */
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  My Photo Listings
                </h3>
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 text-sm rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Upload Photo
                </Link>
              </div>

              {myListings.length === 0 ? (
                <div className="text-center py-16">
                  <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No listings yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Upload your first photo and start selling!
                  </p>
                  <Link
                    href="/upload"
                    className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Upload Photo
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myListings.map((photo) => (
                    <div
                      key={photo.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      {/* Thumbnail (NOT editable - view only) */}
                      <div className="w-full sm:w-24 h-36 sm:h-18 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                        <Image
                          src={photo.thumbnailUrl || photo.imageUrl}
                          alt={photo.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {photo.title}
                          </p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[photo.status] || ""}`}>
                            {photo.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate mb-1">
                          {photo.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="capitalize">{photo.category}</span>
                          <span>•</span>
                          <span className="font-medium text-emerald-600">
                            NPR {photo.priceNPR}
                          </span>
                          <span>•</span>
                          <span>{photo.salesCount || 0} sales</span>
                          <span>•</span>
                          <span>{formatDate(photo.createdAt)}</span>
                        </div>
                        {photo.tags && photo.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {photo.tags.slice(0, 5).map((tag) => (
                              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                            {photo.tags.length > 5 && (
                              <span className="text-xs text-gray-400">+{photo.tags.length - 5} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions: Edit & Delete (NO photo change) */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEditModal(photo)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Edit title, description, price, tags"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(photo.id)}
                          disabled={deletingId === photo.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Delete listing"
                        >
                          {deletingId === photo.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


          ) : activeTab === "equipment" ? (
            /* ─── MY EQUIPMENT LISTINGS TAB ─────────────────── */
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">My Equipment Listings</h3>
                  <p className="text-sm text-gray-500">Edit, delete, mark sold, or pause your WildSaura Market equipment listings.</p>
                </div>
                <Link
                  href="/shopping/sell"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <Package className="h-4 w-4" />
                  Sell Equipment
                </Link>
              </div>

              {myEquipmentListings.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment listings yet</h3>
                  <p className="text-gray-500 mb-4">Create your first internal WildSaura Market equipment listing.</p>
                  <Link
                    href="/shopping/sell"
                    className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    Sell Equipment
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myEquipmentListings.map((listing) => {
                    const isUpdating = updatingEquipmentId === listing.id;
                    return (
                      <div
                        key={listing.id}
                        className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="relative w-full lg:w-28 h-44 lg:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {listing.thumbnailUrl ? (
                            <Image
                              src={listing.thumbnailUrl}
                              alt={listing.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-300" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 truncate">{listing.title}</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                              listing.status === "active"
                                ? "bg-green-100 text-green-800"
                                : listing.status === "sold"
                                  ? "bg-gray-200 text-gray-700"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {listing.status === "inactive" ? "paused" : listing.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate mb-1">
                            {listing.brand} • {listing.category} • {listing.condition}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{listing.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                            <span className="font-medium text-emerald-600">NPR {listing.priceNPR}</span>
                            {listing.location && <span>{listing.location}</span>}
                            <span>{formatDate(listing.createdAt)}</span>
                            {listing.contactPreference && <span>Contact: {listing.contactPreference.replace("wildsaura-", "WildSaura ")}</span>}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                          <Link
                            href={`/shopping/sell?edit=${listing.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </Link>
                          {listing.status !== "sold" && (
                            <button
                              onClick={() => handleEquipmentStatus(listing.id, "sold")}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Mark Sold
                            </button>
                          )}
                          {listing.status === "active" ? (
                            <button
                              onClick={() => handleEquipmentStatus(listing.id, "inactive")}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                            >
                              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                              Pause Listing
                            </button>
                          ) : listing.status === "inactive" ? (
                            <button
                              onClick={() => handleEquipmentStatus(listing.id, "active")}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                              Resume
                            </button>
                          ) : null}
                          <button
                            onClick={() => handleDeleteEquipment(listing.id)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          ) : activeTab === "purchases" ? (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Orders & Tracking
                  </h3>
                  <p className="text-sm text-gray-500">
                    Track equipment orders, payment status, and photo download readiness.
                  </p>
                </div>
                <Link
                  href="/shopping"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <Package className="h-4 w-4" />
                  Shop Equipment
                </Link>
              </div>

              {buyerOrders.length === 0 && purchases.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No orders yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Buy photos or equipment and your order tracking will appear here.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link
                      href="/explore"
                      className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                    >
                      <Search className="w-4 h-4" />
                      Browse Photos
                    </Link>
                    <Link
                      href="/shopping"
                      className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      Shop Equipment
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {buyerOrders.map((order) => {
                    const meta = orderStatusMeta(order);
                    const StatusIcon = meta.icon;
                    return (
                      <div
                        key={order.id}
                        className="rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-3 mb-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                {meta.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {formatDate(order.createdAt)} • {order.paymentMethod.replaceAll("_", " ")}
                              {order.transactionRef ? ` • ${order.transactionRef}` : ""}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-emerald-700">Rs. {order.totalNPR}</p>
                        </div>

                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={`${order.id}-${index}`} className="flex items-center gap-4">
                              <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                {item.thumbnailUrl ? (
                                  <Image
                                    src={item.thumbnailUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package className="h-6 w-6 text-gray-300" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-gray-900 truncate">{item.title}</p>
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                    {item.itemType === "equipment" ? "Equipment" : "Photo"}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500">{itemTrackingLabel(item, order)}</p>
                                {(item.sellerName || item.ownerName) && (
                                  <p className="text-xs text-gray-400">Seller: {item.sellerName || item.ownerName}</p>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-gray-900">Rs. {item.priceNPR}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {buyerOrders.length === 0 && purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {purchase.photoUrl && (
                          <Image
                            src={purchase.photoUrl}
                            alt={purchase.photoTitle}
                            width={80}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {purchase.photoTitle}
                        </p>
                        <p className="text-sm text-gray-500">
                          {purchase.purchasedAt.toLocaleDateString()} •{" "}
                          {purchase.status}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900">
                        Rs. {purchase.price}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          ) : activeTab === "points" ? (
            <div className="p-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <Coins className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-700">WildSaura Points</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {userPoints}/{MAX_WILDSAURA_POINTS}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${pointProgress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-amber-700">
                      Maximum {MAX_WILDSAURA_POINTS} points per user.
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-900">How to earn</h3>
                    <div className="mt-4 space-y-3 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>First login</span>
                        <span className="font-semibold text-emerald-700">+30</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Full verification</span>
                        <span className="font-semibold text-emerald-700">+10</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Daily login, 30 days</span>
                        <span className="font-semibold text-emerald-700">+2/day</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Referral joins</span>
                        <span className="font-semibold text-emerald-700">+10</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Referral verifies</span>
                        <span className="font-semibold text-emerald-700">+5</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-emerald-600" />
                      <h3 className="font-semibold text-gray-900">Referral link</h3>
                    </div>
                    <p className="mt-2 break-all rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
                      {referralLink}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(referralLink);
                        toast.success("Referral link copied");
                      }}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Referral Link
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="rounded-2xl border border-gray-100">
                    <div className="border-b border-gray-100 p-5">
                      <h3 className="text-lg font-semibold text-gray-900">Point History</h3>
                      <p className="text-sm text-gray-500">
                        Rewards, purchases, and point deductions appear here.
                      </p>
                    </div>
                    {pointHistory.length === 0 ? (
                      <div className="py-16 text-center">
                        <Coins className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                        <p className="font-medium text-gray-900">No point history yet</p>
                        <p className="mt-1 text-sm text-gray-500">
                          Your rewards will appear after your next login.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {pointHistory.map((item) => {
                          const isDebit = item.points < 0;
                          return (
                          <div key={item.id} className="flex items-center gap-4 p-4">
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                              isDebit ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              <Coins className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900">{item.title}</p>
                              {item.description && (
                                <p className="truncate text-sm text-gray-500">{item.description}</p>
                              )}
                              <p className="mt-1 text-xs text-gray-400">{formatDate(item.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${isDebit ? "text-red-700" : "text-emerald-700"}`}>
                                {isDebit ? item.points : `+${item.points}`}
                              </p>
                              {typeof item.balanceAfter === "number" && (
                                <p className="text-xs text-gray-400">Balance {item.balanceAfter}</p>
                              )}
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          ) : activeTab === "downloads" ? (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Downloaded Photos
              </h3>
              {downloads.length === 0 ? (
                <div className="text-center py-16">
                  <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No downloads yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Purchase photos to download them in full resolution
                  </p>
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Browse Photos
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {downloads.map((photo) => (
                    <div
                      key={photo.id}
                      className="group overflow-hidden rounded-xl border border-gray-100 bg-white hover:shadow-md transition-all"
                    >
                      <Link href={`/photo/${photo.id}`} className="block">
                        <div className="aspect-[4/3] relative">
                          <Image
                            src={photo.thumbnailUrl || photo.imageUrl}
                            alt={photo.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </Link>
                      <div className="p-3">
                        <Link href={`/photo/${photo.id}`} className="block">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {photo.title}
                          </p>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDownloadPhoto(photo)}
                          disabled={downloadingPhotoId === photo.id}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {downloadingPhotoId === photo.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileArchive className="h-3.5 w-3.5" />
                          )}
                          Download ZIP
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          ) : (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Favorite Photos
              </h3>
              {favorites.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No favorites yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Heart photos you love to save them here
                  </p>
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Browse Photos
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {favorites.map((photo) => (
                    <Link
                      key={photo.id}
                      href={`/photo/${photo.id}`}
                      className="group rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all"
                    >
                      <div className="aspect-[4/3] relative">
                        <Image
                          src={photo.thumbnailUrl || photo.imageUrl}
                          alt={photo.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {photo.title}
                        </p>
                        <p className="text-sm text-emerald-600">
                          Rs. {photo.priceNPR}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── EDIT MODAL (No Photo Change) ────────────────────── */}
      {editingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setEditingPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Listing</h3>
                <p className="text-sm text-gray-500">Edit title, description, price & tags</p>
              </div>
              <button
                onClick={() => setEditingPhoto(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Photo Preview (read-only, not changeable) */}
            <div className="relative w-full aspect-[16/9] bg-gray-100">
              <Image
                src={editingPhoto.imageUrl}
                alt={editingPhoto.title}
                fill
                className="object-contain"
              />
            </div>
            <div className="px-5 py-2 bg-amber-50 border-b border-amber-200">
              <div className="flex items-center gap-2 text-amber-700 text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Photo cannot be changed. Only title, description, price & tags can be edited.
              </div>
            </div>

            {/* Edit Form */}
            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <FileText className="w-4 h-4" />
                  Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={100}
                  required
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <FileText className="w-4 h-4" />
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  maxLength={500}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as PhotoCategory)}
                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="w-4 h-4" />
                    Price (NPR) *
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    min={10}
                    max={50000}
                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Tag className="w-4 h-4" />
                  Tags ({editTags.length}/25)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setEditTags(editTags.filter((t) => t !== tag))}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const newTag = editTagInput.trim().toLowerCase();
                        if (newTag && !editTags.includes(newTag) && editTags.length < 25) {
                          setEditTags([...editTags, newTag]);
                          setEditTagInput("");
                        }
                      }
                    }}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {editSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingPhoto(null)}
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
