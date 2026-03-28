"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  Eye,
  Download,
  TrendingUp,
  Star,
  Tag,
  ArrowLeft,
  X,
  Zap,
  BarChart3,
  Camera,
  ChevronRight,
  Heart,
  ExternalLink,
} from "lucide-react";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn, formatNPR, formatDate } from "@/lib/utils";
import type { StockPhoto, CartItem } from "@/types";
import toast, { Toaster } from "react-hot-toast";

/* ───────────────────────── helpers ───────────────────────── */

function getCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("wildsaura_cart") || "[]");
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem("wildsaura_cart", JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

function isInCart(photoId: string): boolean {
  return getCartItems().some((i) => i.photoId === photoId);
}

/* ─────────────────── quality stars ──────────────────── */

function QualityStars({ score }: { score: number }) {
  const full = Math.floor(score);
  const hasHalf = score - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < full
              ? "fill-brand-secondary text-brand-secondary"
              : i === full && hasHalf
                ? "fill-brand-secondary/50 text-brand-secondary"
                : "text-gray-300"
          )}
        />
      ))}
      <span className="ml-1.5 text-sm font-medium text-gray-600">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

/* ─────────────────── demand badge ──────────────────── */

function DemandBadge({ demand }: { demand: "High" | "Medium" | "Low" }) {
  const styles = {
    High: "bg-green-100 text-green-700 border-green-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    Low: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[demand]
      )}
    >
      <TrendingUp className="h-3 w-3" />
      {demand} Demand
    </span>
  );
}

/* ─────────────────── lightbox ──────────────────── */

function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={1200}
          className="max-h-[90vh] w-auto rounded-lg object-contain"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
        {/* Block overlay */}
        <div
          className="absolute inset-0 z-10"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    </div>
  );
}

/* ─────────────────── related card ──────────────────── */

function RelatedPhotoCard({ photo }: { photo: StockPhoto }) {
  return (
    <Link href={`/photo/${photo.id}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-muted shadow-card transition-shadow group-hover:shadow-card-hover">
        <Image
          src={photo.thumbnailUrl}
          alt={photo.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          quality={50}
        />
        <div className="absolute inset-0 z-[2]" onContextMenu={(e) => e.preventDefault()} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="truncate text-sm font-medium text-white">
            {photo.title}
          </p>
          <p className="text-sm font-bold text-brand-secondary">
            {formatNPR(photo.priceNPR)}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────── skeleton ──────────────────── */

function PhotoDetailSkeleton() {
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-gray-200" />
          </div>
          <div className="space-y-4 lg:col-span-2">
            <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
              <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-7 w-16 animate-pulse rounded-full bg-gray-200"
                />
              ))}
            </div>
            <div className="h-12 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════ MAIN ══════════════════════════ */

export default function PhotoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const photoId = params?.id as string;

  const [photo, setPhoto] = useState<StockPhoto | null>(null);
  const [related, setRelated] = useState<StockPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  /* ── fetch photo ── */
  useEffect(() => {
    if (!photoId) return;
    let cancelled = false;

    async function fetchPhoto() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "photos", photoId));
        if (!snap.exists()) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = { id: snap.id, ...snap.data() } as StockPhoto;
        if (data.status !== "approved" && data.status !== ("active" as any)) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!cancelled) {
          setPhoto(data);
          setInCart(isInCart(photoId));
        }

        // increment view
        updateDoc(doc(db, "photos", photoId), {
          viewCount: increment(1),
        }).catch(() => {});

        // related
        const q = query(
          collection(db, "photos"),
          where("category", "==", data.category),
          where("status", "==", "approved"),
          limit(5)
        );
        const relSnap = await getDocs(q);
        const relPhotos: StockPhoto[] = [];
        relSnap.forEach((d) => {
          if (d.id !== photoId) {
            relPhotos.push({ id: d.id, ...d.data() } as StockPhoto);
          }
        });
        if (!cancelled) setRelated(relPhotos.slice(0, 4));
      } catch (err) {
        console.error("Error fetching photo:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPhoto();
    return () => {
      cancelled = true;
    };
  }, [photoId]);

  /* ── cart sync ── */
  useEffect(() => {
    const handler = () => setInCart(isInCart(photoId));
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, [photoId]);

  /* ── cart actions ── */
  const handleAddToCart = useCallback(() => {
    if (!photo) return;
    if (inCart) {
      toast("Already in your cart", { icon: "✓" });
      return;
    }
    const cart = getCartItems();
    cart.push({
      photoId: photo.id,
      title: photo.title,
      thumbnailUrl: photo.thumbnailUrl || photo.imageUrl,
      priceNPR: photo.priceNPR,
      ownerName: photo.ownerName,
    });
    saveCart(cart);
    setInCart(true);
    toast.success("Added to cart!");
  }, [photo, inCart]);

  const handleBuyNow = useCallback(() => {
    if (!photo) return;
    if (!inCart) {
      const cart = getCartItems();
      cart.push({
        photoId: photo.id,
        title: photo.title,
        thumbnailUrl: photo.thumbnailUrl || photo.imageUrl,
        priceNPR: photo.priceNPR,
        ownerName: photo.ownerName,
      });
      saveCart(cart);
      setInCart(true);
    }
    router.push("/cart");
  }, [photo, inCart, router]);

  /* ── loading ── */
  if (loading) return <PhotoDetailSkeleton />;

  /* ── not found ── */
  if (notFound || !photo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-light px-4">
        <Toaster position="top-right" />
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <Camera className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-brand-dark">
            Photo Not Found
          </h1>
          <p className="mt-2 text-gray-500">
            This photo doesn't exist or is no longer available.
          </p>
          <Link
            href="/explore"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 font-medium text-white transition hover:bg-brand-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Photos
          </Link>
        </div>
      </div>
    );
  }

  /* ── category label ── */
  const categoryLabel =
    photo.category.charAt(0).toUpperCase() + photo.category.slice(1);

  return (
    <div className="min-h-screen bg-brand-light">
      <Toaster position="top-right" />
      {lightboxOpen && (
        <Lightbox
          src={photo.thumbnailUrl || photo.imageUrl}
          alt={photo.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── breadcrumb ── */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/explore" className="transition hover:text-brand-primary">
            Explore
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href={`/explore?category=${photo.category}`}
            className="transition hover:text-brand-primary"
          >
            {categoryLabel}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-brand-dark">{photo.title}</span>
        </nav>

        {/* ═══════════ two-column layout ═══════════ */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* ── image column ── */}
          <div className="lg:col-span-3">
            <div
              className="group relative cursor-zoom-in overflow-hidden rounded-2xl bg-surface-muted shadow-card"
              onClick={() => setLightboxOpen(true)}
            >
              <div
                className="relative aspect-[4/3]"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{ userSelect: "none", WebkitUserSelect: "none" }}
              >
                <Image
                  src={photo.thumbnailUrl || photo.imageUrl}
                  alt={photo.title}
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  quality={60}
                />
                {/* Block overlay to prevent save-as */}
                <div
                  className="absolute inset-0 z-[5]"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                />
                {/* watermark */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                  <div className="flex flex-col gap-12 -rotate-[30deg]">
                    <span className="select-none whitespace-nowrap font-heading text-3xl font-bold tracking-[0.2em] text-white/25 sm:text-4xl lg:text-5xl">
                      WildSaura &nbsp; WildSaura &nbsp; WildSaura
                    </span>
                    <span className="select-none whitespace-nowrap font-heading text-3xl font-bold tracking-[0.2em] text-white/25 sm:text-4xl lg:text-5xl">
                      PREVIEW ONLY &nbsp; PREVIEW ONLY
                    </span>
                    <span className="select-none whitespace-nowrap font-heading text-3xl font-bold tracking-[0.2em] text-white/25 sm:text-4xl lg:text-5xl">
                      WildSaura &nbsp; WildSaura &nbsp; WildSaura
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                Click to enlarge
              </div>
            </div>
          </div>

          {/* ── info column ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 space-y-6">
              {/* title */}
              <h1 className="font-heading text-2xl font-bold leading-tight text-brand-dark sm:text-3xl">
                {photo.title}
              </h1>

              {/* photographer */}
              <Link
                href={`/photographer/${photo.ownerId}`}
                className="flex items-center gap-3 transition hover:opacity-80"
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                  {photo.ownerAvatar ? (
                    <Image
                      src={photo.ownerAvatar}
                      alt={photo.ownerName || "Photographer"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand-primary/10 text-sm font-bold text-brand-primary">
                      {(photo.ownerName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-dark">
                    {photo.ownerName || "Unknown Photographer"}
                  </p>
                  <p className="text-xs text-gray-500">View Portfolio →</p>
                </div>
              </Link>

              {/* description */}
              {photo.description && (
                <p className="text-sm leading-relaxed text-gray-600">
                  {photo.description}
                </p>
              )}

              {/* category badge */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/explore?category=${photo.category}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/20"
                >
                  <Camera className="h-3 w-3" />
                  {categoryLabel}
                </Link>
                {photo.marketDemand && (
                  <DemandBadge demand={photo.marketDemand} />
                )}
              </div>

              {/* tags */}
              {photo.tags && photo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {photo.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/explore?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-brand-primary hover:text-brand-primary"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* quality score */}
              {photo.qualityScore != null && photo.qualityScore > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">
                    Quality:
                  </span>
                  <QualityStars score={photo.qualityScore} />
                </div>
              )}

              {/* stats */}
              <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">
                    {photo.viewCount?.toLocaleString() || 0}
                  </span>
                  <span className="hidden sm:inline">views</span>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Download className="h-4 w-4" />
                  <span className="font-medium">{photo.salesCount || 0}</span>
                  <span className="hidden sm:inline">sales</span>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">{photo.salesCount || 0}</span>
                  <span className="hidden sm:inline">downloads</span>
                </div>
              </div>

              {/* price */}
              <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4">
                <p className="text-sm font-medium text-gray-500">Price</p>
                <p className="font-heading text-3xl font-bold text-brand-primary">
                  {formatNPR(photo.priceNPR)}
                </p>
              </div>

              {/* action buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={inCart}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition",
                    inCart
                      ? "cursor-default border-2 border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "bg-brand-primary text-white shadow-lg shadow-brand-primary/25 hover:bg-brand-primary/90 active:scale-[0.98]"
                  )}
                >
                  {inCart ? (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      In Cart ✓
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-secondary px-6 py-3.5 text-sm font-semibold text-brand-dark shadow-lg shadow-brand-secondary/25 transition hover:bg-brand-secondary/90 active:scale-[0.98]"
                >
                  <Zap className="h-4 w-4" />
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ photographer section ═══════════ */}
        <div className="mt-16 rounded-2xl border border-gray-100 bg-white p-6 shadow-card sm:p-8">
          <h2 className="mb-4 font-heading text-xl font-bold text-brand-dark">
            About the Photographer
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
              {photo.ownerAvatar ? (
                <Image
                  src={photo.ownerAvatar}
                  alt={photo.ownerName || "Photographer"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-primary/10 text-xl font-bold text-brand-primary">
                  {(photo.ownerName || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-brand-dark">
                {photo.ownerName || "Unknown Photographer"}
              </p>
              <p className="text-sm text-gray-500">Wildlife & Nature Photographer</p>
            </div>
            <Link
              href={`/photographer/${photo.ownerId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-primary bg-brand-primary/5 px-5 py-2.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/10"
            >
              View Portfolio
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* ═══════════ related photos ═══════════ */}
        {related.length > 0 && (
          <div className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold text-brand-dark">
                Related Photos
              </h2>
              <Link
                href={`/explore?category=${photo.category}`}
                className="flex items-center gap-1 text-sm font-medium text-brand-primary transition hover:underline"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {related.map((rp) => (
                <RelatedPhotoCard key={rp.id} photo={rp} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
