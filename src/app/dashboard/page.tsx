"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  ShoppingBag,
  Heart,
  Eye,
  TrendingUp,
  Search,
  ExternalLink,
  Camera,
  Package,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DRISHYA_APP_URL } from "@/types";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { StockPhoto } from "@/types";

interface PurchaseRecord {
  id: string;
  photoId: string;
  photoTitle: string;
  photoUrl: string;
  price: number;
  purchasedAt: Date;
  status: "completed" | "pending" | "failed";
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [downloads, setDownloads] = useState<StockPhoto[]>([]);
  const [favorites, setFavorites] = useState<StockPhoto[]>([]);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalDownloads: 0,
    totalSpent: 0,
    favoriteCount: 0,
  });
  const [activeTab, setActiveTab] = useState<
    "overview" | "purchases" | "downloads" | "favorites"
  >("overview");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setDataLoading(true);
      try {
        // Fetch purchases
        const purchasesRef = collection(db, "purchases");
        const purchasesQuery = query(
          purchasesRef,
          where("userId", "==", user.uid),
          orderBy("purchasedAt", "desc"),
          limit(20)
        );
        const purchasesSnap = await getDocs(purchasesQuery);
        const purchasesList = purchasesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          purchasedAt: doc.data().purchasedAt?.toDate() || new Date(),
        })) as PurchaseRecord[];
        setPurchases(purchasesList);

        // Fetch downloads
        const downloadsRef = collection(db, "downloads");
        const downloadsQuery = query(
          downloadsRef,
          where("userId", "==", user.uid),
          orderBy("downloadedAt", "desc"),
          limit(20)
        );
        const downloadsSnap = await getDocs(downloadsQuery);
        const downloadIds = downloadsSnap.docs.map(
          (doc) => doc.data().photoId
        );

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

        // Calculate stats
        setStats({
          totalPurchases: purchasesList.length,
          totalDownloads: downloadsSnap.docs.length,
          totalSpent: purchasesList.reduce((sum, p) => sum + (p.price || 0), 0),
          favoriteCount: favSnap.docs.length,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setDataLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!user) return null;

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
              Manage your purchases and downloads
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
            <a
              href={DRISHYA_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-emerald-200 text-emerald-700 px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-50 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Sell on Drishya
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          {[
            { id: "overview" as const, label: "Overview", icon: Eye },
            { id: "purchases" as const, label: "Purchases", icon: ShoppingBag },
            { id: "downloads" as const, label: "Downloads", icon: Download },
            { id: "favorites" as const, label: "Favorites", icon: Heart },
          ].map((tab) => (
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
              {/* Quick Actions */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <Link
                  href="/explore"
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
                >
                  <Search className="w-8 h-8 text-emerald-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Browse Photos</h4>
                    <p className="text-sm text-gray-500">
                      Discover amazing photography
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
                <a
                  href={DRISHYA_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors"
                >
                  <Camera className="w-8 h-8 text-orange-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Sell on Drishya
                    </h4>
                    <p className="text-sm text-gray-500">
                      Upload & sell your photos
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                </a>
              </div>

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
          ) : activeTab === "purchases" ? (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Purchase History
              </h3>
              {purchases.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No purchases yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Start exploring our collection of stunning photos
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
                <div className="space-y-3">
                  {purchases.map((purchase) => (
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
                      </div>
                    </Link>
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
    </div>
  );
}
