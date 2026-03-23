"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Camera,
  ShoppingCart,
  Eye,
  TrendingUp,
  Calendar,
  BadgeCheck,
  Globe,
  ImageIcon,
  Loader2,
  UserX,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import toast from "react-hot-toast";
import type { StockPhoto, UserProfile, PhotoCategory, CartItem } from "@/types";
import { DRISHYA_APP_URL, CATEGORIES } from "@/types";

const ALL_CATEGORIES: { value: PhotoCategory | "all"; label: string }[] = [
  { value: "all", label: "All Photos" },
  ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
];

export default function PhotographerProfilePage() {
  const params = useParams();
  const photographerId = params.id as string;

  const [photographer, setPhotographer] = useState<UserProfile | null>(null);
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PhotoCategory | "all">("all");

  useEffect(() => {
    if (!photographerId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch photographer profile
        const userDoc = await getDoc(doc(db, "users", photographerId));
        if (!userDoc.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const userData = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
        setPhotographer(userData);

        // Fetch approved public photos
        const photosQuery = query(
          collection(db, "photos"),
          where("ownerId", "==", photographerId),
          where("status", "==", "approved"),
          where("isPublic", "==", true),
          orderBy("createdAt", "desc")
        );
        const photosSnap = await getDocs(photosQuery);
        const results: StockPhoto[] = [];
        photosSnap.forEach((d) => {
          results.push({ id: d.id, ...d.data() } as StockPhoto);
        });
        setPhotos(results);
      } catch (err) {
        console.error("Failed to load photographer:", err);
        toast.error("Failed to load profile");
      }
      setLoading(false);
    };

    fetchData();
  }, [photographerId]);

  const filteredPhotos = useMemo(() => {
    if (activeCategory === "all") return photos;
    return photos.filter((p) => p.category === activeCategory);
  }, [photos, activeCategory]);

  const totalViews = useMemo(() => {
    return photos.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  }, [photos]);

  const totalSales = useMemo(() => {
    return photos.reduce((sum, p) => sum + (p.salesCount || 0), 0);
  }, [photos]);

  const addToCart = (photo: StockPhoto) => {
    try {
      const raw = localStorage.getItem("wildsaura_cart");
      const cart: CartItem[] = raw ? JSON.parse(raw) : [];
      if (cart.some((item) => item.photoId === photo.id)) {
        toast.error("Already in cart");
        return;
      }
      cart.push({
        photoId: photo.id,
        title: photo.title,
        thumbnailUrl: photo.thumbnailUrl || photo.imageUrl,
        priceNPR: photo.priceNPR,
        ownerName: photo.ownerName,
      });
      localStorage.setItem("wildsaura_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Added to cart!");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const formatDate = (date: Date | { seconds: number } | string) => {
    let d: Date;
    if (date && typeof date === "object" && "seconds" in date) {
      d = new Date(date.seconds * 1000);
    } else {
      d = new Date(date as string);
    }
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // --- RENDERS ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
          <p className="text-gray-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (notFound || !photographer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="bg-white rounded-2xl shadow-card p-10 text-center max-w-md">
          <UserX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-brand-dark mb-2">
            Photographer Not Found
          </h1>
          <p className="text-gray-500 mb-6">
            This photographer profile doesn&apos;t exist or may have been removed.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-primary/90 transition-colors"
          >
            Explore Photos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Profile Header */}
      <div className="bg-white border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-brand-primary/10 flex-shrink-0 bg-gray-100">
              {photographer.avatarUrl ? (
                <Image
                  src={photographer.avatarUrl}
                  alt={photographer.displayName}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-primary/10">
                  <Camera className="w-10 h-10 text-brand-primary/50" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="font-heading text-3xl font-bold text-brand-dark">
                  {photographer.displayName}
                </h1>
                {photographer.isVerified && (
                  <BadgeCheck className="w-6 h-6 text-brand-primary fill-brand-primary/20" />
                )}
              </div>

              {photographer.bio && (
                <p className="text-gray-600 mt-2 max-w-xl leading-relaxed">{photographer.bio}</p>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDate(photographer.createdAt)}
                </span>
                {photographer.website && (
                  <a
                    href={photographer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-brand-primary hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6 mt-5">
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-dark">{photos.length}</p>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Photos</p>
                </div>
                <div className="w-px h-8 bg-surface-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-dark">{totalSales.toLocaleString()}</p>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sales</p>
                </div>
                <div className="w-px h-8 bg-surface-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-dark">{totalViews.toLocaleString()}</p>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Views</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b border-surface-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            {ALL_CATEGORIES.map((cat) => {
              const count =
                cat.value === "all"
                  ? photos.length
                  : photos.filter((p) => p.category === cat.value).length;
              if (cat.value !== "all" && count === 0) return null;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                    activeCategory === cat.value
                      ? "bg-brand-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {cat.label}
                  <span className="ml-1.5 text-xs opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredPhotos.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center">
            <ImageIcon className="w-16 h-16 text-gray-300" />
            <h2 className="font-heading text-xl font-bold text-brand-dark">
              {photos.length === 0
                ? "No photos published yet"
                : "No photos in this category"}
            </h2>
            <p className="text-gray-500 max-w-md">
              {photos.length === 0
                ? "This photographer hasn't published any photos yet. Check back later!"
                : "Try selecting a different category to see more photos."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group bg-white rounded-xl shadow-card overflow-hidden card-hover border border-surface-border"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <Image
                    src={photo.thumbnailUrl || photo.imageUrl}
                    alt={photo.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h3 className="text-white font-semibold text-sm truncate">{photo.title}</h3>
                    <p className="text-white/80 text-lg font-bold mt-1">
                      NPR {photo.priceNPR?.toLocaleString()}
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(photo);
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-brand-secondary text-brand-dark font-semibold py-2.5 rounded-lg hover:bg-brand-secondary/90 transition-colors text-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <Link href={`/photo/${photo.id}`}>
                    <h3 className="font-semibold text-brand-dark truncate hover:text-brand-primary transition-colors">
                      {photo.title}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded capitalize">
                      {photo.category}
                    </span>
                    <span className="text-sm font-bold text-brand-primary">
                      NPR {photo.priceNPR?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {(photo.viewCount || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {photo.salesCount} sold
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-primary/80 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Sparkles className="w-10 h-10 text-brand-secondary mx-auto mb-4" />
          <h2 className="font-heading text-3xl font-bold text-white mb-3">
            Sell Your Photos Too
          </h2>
          <p className="text-white/80 max-w-lg mx-auto mb-6 leading-relaxed">
            Join Nepal&apos;s growing community of photographers. Upload your best shots on Drishya
            and start earning from your photography.
          </p>
          <a
            href={DRISHYA_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand-secondary text-brand-dark font-bold px-8 py-4 rounded-xl hover:bg-brand-secondary/90 transition-colors text-lg"
          >
            Start Selling on Drishya
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
