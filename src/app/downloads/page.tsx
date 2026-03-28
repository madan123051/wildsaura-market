"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  ImageIcon,
  Loader2,
  Lock,
  LogIn,
  Calendar,
  Package,
  ExternalLink,
  Search,
} from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { cn, formatDate } from "@/lib/utils";
import type { Download as DownloadType } from "@/types";
import toast, { Toaster } from "react-hot-toast";

/* ═══════════════════════════ MAIN ═══════════════════════════ */

export default function DownloadsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [downloads, setDownloads] = useState<DownloadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  /* ── auth ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  /* ── fetch downloads ── */
  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchDownloads() {
      setLoading(true);
      try {
        const q = query(
          collection(db, "downloads"),
          where("buyerId", "==", user!.uid),
          orderBy("purchasedAt", "desc")
        );
        const snap = await getDocs(q);
        const items: DownloadType[] = [];
        snap.forEach((d) => {
          items.push({ id: d.id, ...d.data() } as DownloadType);
        });
        if (!cancelled) setDownloads(items);
      } catch (err) {
        console.error("Error fetching downloads:", err);
        if (!cancelled) toast.error("Failed to load downloads");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDownloads();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  /* ── filter ── */
  const filtered = searchTerm
    ? downloads.filter((d) =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : downloads;

  /* ── secure download handler ── */
  const handleDownload = async (dl: DownloadType) => {
    try {
      if (!user) {
        toast.error("Please log in to download");
        return;
      }
      
      toast.loading("Preparing download...", { id: "dl-" + dl.photoId });
      
      // Get auth token
      const token = await user.getIdToken();
      
      // Call secure download API
      const res = await fetch(`/api/download/${dl.photoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Download failed", { id: "dl-" + dl.photoId });
        return;
      }
      
      if (data.downloadUrl) {
        // Trigger download via hidden anchor
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = dl.title || "photo";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Download started! 🎉", { id: "dl-" + dl.photoId });
      } else {
        toast.error("Download URL not available yet", { id: "dl-" + dl.photoId });
      }
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Download failed. Please try again.", { id: "dl-" + dl.photoId });
    }
  };

  /* ── loading state ── */
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-light">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  /* ── not logged in ── */
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-light px-4">
        <Toaster position="top-right" />
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/10">
            <Lock className="h-10 w-10 text-brand-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-brand-dark">
            Login Required
          </h1>
          <p className="mt-2 text-gray-500">
            Please log in to view your purchased downloads.
          </p>
          <Link
            href="/login?redirect=/downloads"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition hover:bg-brand-primary/90"
          >
            <LogIn className="h-4 w-4" />
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── header ── */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-brand-dark">
            My Downloads
          </h1>
          <p className="mt-1 text-gray-500">
            Access your purchased photos anytime
          </p>
        </div>

        {/* ── stats ── */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
                <Download className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">
                  {downloads.length}
                </p>
                <p className="text-xs text-gray-500">Total Downloads</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-secondary/10">
                <ImageIcon className="h-5 w-5 text-brand-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">
                  {downloads.length}
                </p>
                <p className="text-xs text-gray-500">Photos Purchased</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">
                  {new Set(downloads.map((d) => d.orderId)).size}
                </p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── loading downloads ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            <p className="mt-3 text-sm text-gray-500">
              Loading your downloads...
            </p>
          </div>
        )}

        {/* ── empty state ── */}
        {!loading && downloads.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-20 shadow-card">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <Download className="h-12 w-12 text-gray-300" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-brand-dark">
              No Downloads Yet
            </h2>
            <p className="mt-2 max-w-md text-center text-gray-500">
              You haven&apos;t purchased any photos yet. Browse our collection
              of stunning Nepal photography.
            </p>
            <Link
              href="/explore"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition hover:bg-brand-primary/90"
            >
              <ImageIcon className="h-4 w-4" />
              Browse Photos
            </Link>
          </div>
        )}

        {/* ── downloads grid ── */}
        {!loading && downloads.length > 0 && (
          <>
            {/* search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search downloads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-dark placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <Search className="mb-3 h-8 w-8 text-gray-300" />
                <p className="text-gray-500">
                  No downloads match &quot;{searchTerm}&quot;
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((dl) => (
                  <div
                    key={dl.id}
                    className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card transition-shadow hover:shadow-card-hover"
                  >
                    {/* thumbnail */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
                      <Image
                        src={dl.thumbnailUrl}
                        alt={dl.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        quality={30}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>

                    {/* info */}
                    <div className="p-4">
                      <h3 className="truncate font-medium text-brand-dark">
                        {dl.title}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {dl.purchasedAt
                            ? formatDate(
                                dl.purchasedAt instanceof Date
                                  ? dl.purchasedAt
                                  : (dl.purchasedAt as any).toDate
                                    ? (dl.purchasedAt as any).toDate()
                                    : new Date(dl.purchasedAt as any)
                              )
                            : "Recently purchased"}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDownload(dl)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90 active:scale-[0.98]"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
