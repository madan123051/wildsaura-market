"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPriceNPR, formatDate, pointsToNPR } from "@/lib/utils";
import { Camera, Wallet, TrendingUp, LogOut, Upload } from "lucide-react";
import type { StockPhoto } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, logout, loading } = useAuth();
  const [photos,    setPhotos]    = useState<StockPhoto[]>([]);
  const [fetching,  setFetching]  = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/(auth)/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchPhotos = async () => {
      const q = query(
        collection(db, "photos"),
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockPhoto)));
      setFetching(false);
    };
    fetchPhotos();
  }, [user]);

  if (loading || !profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full" />
    </div>
  );

  const totalEarnings  = photos.reduce((sum, p) => sum + p.salesCount * p.priceNPR, 0);
  const approvedPhotos = photos.filter((p) => p.status === "approved").length;
  const pendingPhotos  = photos.filter((p) => p.status === "pending").length;

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
              {profile.isVerified ? "✅ Verified Creator" : "⚠️ KYC Pending – verify to withdraw"}
            </p>
          </div>
          <Button variant="outline" leftIcon={<LogOut size={16} />} onClick={logout} size="sm">
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: <Camera size={22} className="text-brand-primary" />, label: "Total Photos",    value: photos.length },
            { icon: <TrendingUp size={22} className="text-green-600" />, label: "Approved",        value: approvedPhotos },
            { icon: <Wallet size={22} className="text-brand-secondary" />, label: "Wallet Points",  value: profile.walletPoints.toLocaleString() },
            { icon: <TrendingUp size={22} className="text-brand-accent" />, label: "Total Earnings", value: formatPriceNPR(totalEarnings) },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl2 border border-surface-border p-5 shadow-card flex flex-col gap-2">
              {stat.icon}
              <p className="text-2xl font-bold font-heading text-brand-dark">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Upload CTA */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-xl font-semibold text-brand-dark">Your Photos</h2>
          <Button leftIcon={<Upload size={16} />} onClick={() => router.push("/upload")}>
            Upload New
          </Button>
        </div>

        {/* Photo Table */}
        {fetching ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-surface-muted animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Camera size={48} className="mb-3 opacity-30" />
            <p className="font-medium">No photos yet</p>
            <p className="text-sm">Upload your first photo to start earning!</p>
            <Button className="mt-5" onClick={() => router.push("/upload")}>Upload Photo</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl2 border border-surface-border shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-gray-600">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Title</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Category</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Price</th>
                  <th className="text-right px-5 py-3 font-medium hidden md:table-cell">Sales</th>
                  <th className="text-right px-5 py-3 font-medium hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {photos.map((photo, idx) => (
                  <tr key={photo.id} className={idx % 2 === 0 ? "bg-white" : "bg-surface-muted/40"}>
                    <td className="px-5 py-3 font-medium text-brand-dark max-w-[180px] truncate">{photo.title}</td>
                    <td className="px-5 py-3 hidden md:table-cell text-gray-500 capitalize">{photo.category}</td>
                    <td className="px-5 py-3">
                      <Badge variant={photo.status === "approved" ? "success" : photo.status === "rejected" ? "danger" : "warning"}>
                        {photo.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-brand-primary font-semibold">{formatPriceNPR(photo.priceNPR)}</td>
                    <td className="px-5 py-3 text-right hidden md:table-cell text-gray-500">{photo.salesCount}</td>
                    <td className="px-5 py-3 text-right hidden lg:table-cell text-gray-400">{formatDate(photo.createdAt)}</td>
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
