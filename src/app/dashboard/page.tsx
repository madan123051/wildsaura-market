"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPriceNPR, formatDate } from "@/lib/utils";
import { DRISHYA_APP_URL } from "@/types";
import {
  Camera,
  Wallet,
  TrendingUp,
  LogOut,
  Download,
  ShoppingCart,
  ExternalLink,
  Package,
  Eye,
} from "lucide-react";
import type { StockPhoto } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, logout, loading } = useAuth();
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Fetch user's listed photos (uploaded via Drishya, shown here)
  useEffect(() => {
    if (!user) return;
    const fetchPhotos = async () => {
      const q = query(
        collection(db, "photos"),
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setPhotos(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockPhoto))
      );
      setFetching(false);
    };
    fetchPhotos();
  }, [user]);

  if (loading || !profile)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );

  const totalEarnings = photos.reduce(
    (sum, p) => sum + p.salesCount * p.priceNPR,
    0
  );
  const approvedPhotos = photos.filter((p) => p.status === "approved").length;
  const pendingPhotos = photos.filter((p) => p.status === "pending").length;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-brand-dark">
              Namaste, {profile.displayName.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Welcome to your WildSaura dashboard
            </p>
          </div>
          <Button
            variant="outline"
            leftIcon={<LogOut size={16} />}
            onClick={logout}
            size="sm"
          >
            Logout
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Link
            href="/explore"
            className="flex items-center gap-4 bg-white rounded-xl border border-surface-border p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <p className="font-semibold text-brand-dark">Browse & Buy</p>
              <p className="text-xs text-gray-500">
                Explore photos to purchase
              </p>
            </div>
          </Link>

          <Link
            href="/downloads"
            className="flex items-center gap-4 bg-white rounded-xl border border-surface-border p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Download className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-brand-dark">My Downloads</p>
              <p className="text-xs text-gray-500">
                View purchased photos
              </p>
            </div>
          </Link>

          <a
            href={`${DRISHYA_APP_URL}/upload`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Camera className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-700 flex items-center gap-1.5">
                Sell on Drishya
                <ExternalLink className="w-3.5 h-3.5" />
              </p>
              <p className="text-xs text-green-600/70">
                Upload & sell your photos
              </p>
            </div>
          </a>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {
              icon: <Camera size={22} className="text-brand-primary" />,
              label: "Your Listings",
              value: photos.length,
            },
            {
              icon: <Eye size={22} className="text-green-600" />,
              label: "Approved",
              value: approvedPhotos,
            },
            {
              icon: (
                <Wallet size={22} className="text-brand-secondary" />
              ),
              label: "Wallet Points",
              value: profile.walletPoints.toLocaleString(),
            },
            {
              icon: (
                <TrendingUp size={22} className="text-brand-accent" />
              ),
              label: "Total Earnings",
              value: formatPriceNPR(totalEarnings),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl2 border border-surface-border p-5 shadow-card flex flex-col gap-2"
            >
              {stat.icon}
              <p className="text-2xl font-bold font-heading text-brand-dark">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Your Listings */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-xl font-semibold text-brand-dark">
            Your Listings
          </h2>
          {photos.length > 0 && (
            <a
              href={`${DRISHYA_APP_URL}/upload`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
            >
              <Camera size={16} />
              Upload via Drishya
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Photos you upload on{" "}
          <a
            href={DRISHYA_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-primary hover:underline"
          >
            Drishya
          </a>{" "}
          automatically appear here for sale after approval.
        </p>

        {/* Photo Table */}
        {fetching ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-surface-muted animate-pulse"
              />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-surface-border shadow-card">
            <Camera size={48} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">No listings yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs text-center">
              Upload your photos on Drishya — they&apos;ll appear here
              automatically after approval.
            </p>
            <a
              href={`${DRISHYA_APP_URL}/upload`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 bg-brand-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-primary/90 transition-colors"
            >
              <Camera size={16} />
              Upload on Drishya
              <ExternalLink size={14} />
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-xl2 border border-surface-border shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-gray-600">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Title</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Price</th>
                  <th className="text-right px-5 py-3 font-medium hidden md:table-cell">
                    Sales
                  </th>
                  <th className="text-right px-5 py-3 font-medium hidden lg:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {photos.map((photo, idx) => (
                  <tr
                    key={photo.id}
                    className={
                      idx % 2 === 0 ? "bg-white" : "bg-surface-muted/40"
                    }
                  >
                    <td className="px-5 py-3 font-medium text-brand-dark max-w-[180px] truncate">
                      {photo.title}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-gray-500 capitalize">
                      {photo.category}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          photo.status === "approved"
                            ? "success"
                            : photo.status === "rejected"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {photo.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-brand-primary font-semibold">
                      {formatPriceNPR(photo.priceNPR)}
                    </td>
                    <td className="px-5 py-3 text-right hidden md:table-cell text-gray-500">
                      {photo.salesCount}
                    </td>
                    <td className="px-5 py-3 text-right hidden lg:table-cell text-gray-400">
                      {formatDate(photo.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
