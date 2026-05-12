"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ShoppingCart,
  Eye,
  Star,
  Loader2,
  ImageOff,
  ArrowUpDown,
  Filter,
  Tag,
} from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn, formatNPR } from "@/lib/utils";
import type { StockPhoto, PhotoCategory } from "@/types";
import toast from "react-hot-toast";

const CATEGORIES: {
  value: PhotoCategory;
  label: string;
  icon: string;
  description: string;
}[] = [
  { value: "nature", label: "Nature", icon: "🌿", description: "Forests, flowers, plants" },
  { value: "wildlife", label: "Wildlife", icon: "🦁", description: "Animals in their habitat" },
  { value: "landscape", label: "Landscape", icon: "🏔️", description: "Mountains, valleys, scenery" },
  { value: "culture", label: "Culture", icon: "🏛️", description: "Traditions, festivals, heritage" },
  { value: "adventure", label: "Adventure", icon: "🧗", description: "Trekking, sports, extreme" },
  { value: "street", label: "Street", icon: "🏙️", description: "Urban life, people, city" },
  { value: "aerial", label: "Aerial", icon: "🚁", description: "Drone shots, bird eye view" },
  { value: "macro", label: "Macro", icon: "🔬", description: "Close-up, tiny details" },
];

type SortOption = "newest" | "popular" | "price_asc" | "price_desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

const PAGE_SIZE = 20;

/* ───────────── Skeleton Card ───────────── */
function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden shadow-card bg-white">
      <div className="aspect-[4/3] bg-surface-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-surface-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-surface-muted rounded animate-pulse w-1/2" />
        <div className="flex justify-between">
          <div className="h-5 bg-surface-muted rounded animate-pulse w-20" />
          <div className="h-8 bg-surface-muted rounded-lg animate-pulse w-24" />
        </div>
      </div>
    </div>
  );
}

/* ───────────── Photo Card ───────────── */
function PhotoCard({
  photo,
  onAddToCart,
  onQuickView,
}: {
  photo: StockPhoto;
  onAddToCart: (photo: StockPhoto) => void;
  onQuickView: (photo: StockPhoto) => void;
}) {
  const categoryInfo = CATEGORIES.find((c) => c.value === photo.category);

  return (
    <Link href={`/photo/${photo.id}`} className="group block rounded-xl overflow-hidden shadow-card hover:shadow-card-hover bg-white transition-all duration-300 hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-surface-muted overflow-hidden">
        <Image
          src={photo.thumbnailUrl}
          alt={photo.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          quality={30}
        />
        {/* Protect overlay */}
        <div className="absolute inset-0 z-[2]" onContextMenu={(e) => e.preventDefault()} />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
          {/* Top-right actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(photo);
              }}
              className="bg-white/90 hover:bg-white backdrop-blur-sm p-2 rounded-lg shadow-md transition-all duration-200 hover:scale-105"
              title="Quick Preview"
            >
              <Eye className="h-4 w-4 text-brand-dark" />
            </button>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">
              {photo.title}
            </h3>
            <p className="text-white/70 text-xs mb-3">
              by {photo.ownerName || "Photographer"}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(photo);
              }}
              className="w-full flex items-center justify-center gap-2 bg-brand-secondary hover:bg-amber-500 text-brand-dark font-bold text-sm py-2.5 rounded-lg transition-colors duration-200"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart · {formatNPR(photo.priceNPR)}
            </button>
          </div>
        </div>

        {/* Quality Badge */}
        {photo.qualityScore != null && photo.qualityScore >= 8 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-brand-secondary/95 backdrop-blur-sm text-brand-dark text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            <Star className="h-3 w-3 fill-current" />
            Premium
          </div>
        )}

        {/* Category Badge */}
        {categoryInfo && (
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full opacity-100 group-hover:opacity-0 transition-opacity duration-300">
            {categoryInfo.icon} {categoryInfo.label}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="p-4">
        <h3 className="font-semibold text-brand-dark text-sm line-clamp-1">
          {photo.title}
        </h3>
        <p className="text-gray-400 text-xs mt-1">
          {photo.ownerName || "Photographer"}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-brand-primary font-bold text-base">
            {formatNPR(photo.priceNPR)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(photo);
            }}
            className="flex items-center gap-1.5 bg-brand-primary/10 hover:bg-brand-primary hover:text-white text-brand-primary font-semibold text-xs px-3 py-2 rounded-lg transition-all duration-200"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>
    </Link>
  );
}

/* ───────────── Quick View Modal ───────────── */
function QuickViewModal({
  photo,
  onClose,
  onAddToCart,
}: {
  photo: StockPhoto;
  onClose: () => void;
  onAddToCart: (photo: StockPhoto) => void;
}) {
  const categoryInfo = CATEGORIES.find((c) => c.value === photo.category);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[16/10] bg-surface-muted">
          <Image
            src={photo.thumbnailUrl}
            alt={photo.title}
            fill
            className="object-contain bg-gray-900"
            sizes="(max-width: 768px) 100vw, 768px"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            quality={30}
          />
          {/* Watermark overlay */}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
            <div className="flex flex-col gap-14 -rotate-[30deg] opacity-[0.18]">
              <span className="whitespace-nowrap font-heading text-3xl font-bold tracking-[0.2em] text-white">
                WildSaura &nbsp;&nbsp; WildSaura &nbsp;&nbsp; WildSaura
              </span>
              <span className="whitespace-nowrap font-heading text-3xl font-bold tracking-[0.2em] text-white">
                PREVIEW &nbsp;&nbsp; PREVIEW &nbsp;&nbsp; PREVIEW
              </span>
              <span className="whitespace-nowrap font-heading text-3xl font-bold tracking-[0.2em] text-white">
                WildSaura &nbsp;&nbsp; WildSaura &nbsp;&nbsp; WildSaura
              </span>
            </div>
          </div>
          {/* Block overlay */}
          <div className="absolute inset-0 z-[5]" onContextMenu={(e) => e.preventDefault()} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-sm p-2 rounded-full text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-xl font-bold text-brand-dark line-clamp-2">
                {photo.title}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                by {photo.ownerName || "Photographer"}
              </p>
              {categoryInfo && (
                <span className="inline-flex items-center gap-1 text-xs bg-surface-muted text-gray-600 px-2.5 py-1 rounded-full mt-3">
                  {categoryInfo.icon} {categoryInfo.label}
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-brand-primary">
                {formatNPR(photo.priceNPR)}
              </p>
              {photo.qualityScore != null && photo.qualityScore >= 8 && (
                <span className="inline-flex items-center gap-1 text-xs text-brand-secondary font-semibold mt-1">
                  <Star className="h-3 w-3 fill-current" />
                  Premium Quality
                </span>
              )}
            </div>
          </div>

          {photo.description && (
            <p className="text-gray-500 text-sm mt-4 line-clamp-3">
              {photo.description}
            </p>
          )}

          {photo.tags && photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {photo.tags.slice(0, 10).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-surface-muted text-gray-500 px-2.5 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                onAddToCart(photo);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 rounded-xl transition-colors duration-200"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </button>
            <Link
              href={`/photo/${photo.id}`}
              className="px-6 py-3 border border-brand-primary hover:bg-brand-primary/10 text-brand-primary font-semibold rounded-xl transition-colors duration-200 text-center"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   EXPLORE PAGE (inner component using searchParams)
   ═══════════════════════════════════════════════ */
function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-driven state
  const urlQuery = searchParams.get("q") || "";
  const urlCategory = (searchParams.get("category") || "") as PhotoCategory | "";
  const urlTag = searchParams.get("tag") || "";
  const urlSort = (searchParams.get("sort") || "newest") as SortOption;

  // Local state
  const [searchInput, setSearchInput] = useState(urlQuery || urlTag);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory | "">(urlCategory);
  const [sortBy, setSortBy] = useState<SortOption>(urlSort);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [quickViewPhoto, setQuickViewPhoto] = useState<StockPhoto | null>(null);

  // Active search text (from q or tag param)
  const activeSearch = urlQuery || urlTag;

  /* ── Build URL search params ── */
  const updateURL = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams();
      const vals: Record<string, string> = {
        q: urlQuery,
        category: selectedCategory,
        sort: sortBy,
        ...overrides,
      };
      Object.entries(vals).forEach(([k, v]) => {
        if (v && v !== "newest") params.set(k, v);
      });
      // Keep sort=newest out of URL for cleanliness
      if (vals.sort === "newest") params.delete("sort");
      router.push(`/explore?${params.toString()}`, { scroll: false });
    },
    [router, urlQuery, selectedCategory, sortBy]
  );

  /* ── Client-side sort helper ── */
  const sortPhotos = useCallback((photosArr: StockPhoto[], sort: SortOption): StockPhoto[] => {
    const sorted = [...photosArr];
    switch (sort) {
      case "popular":
        sorted.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        break;
      case "price_asc":
        sorted.sort((a, b) => (a.priceNPR || 0) - (b.priceNPR || 0));
        break;
      case "price_desc":
        sorted.sort((a, b) => (b.priceNPR || 0) - (a.priceNPR || 0));
        break;
      case "newest":
      default:
        // Already sorted by createdAt desc from Firestore
        break;
    }
    return sorted;
  }, []);

  /* ── Fetch photos ── */
  const fetchPhotos = useCallback(
    async (isLoadMore = false) => {
      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const photosRef = collection(db, "photos");
        
        // Only use filters that have Firestore indexes: status + isPublic + createdAt
        // Category, search, price, sort are all done CLIENT-SIDE to avoid composite index issues
        const constraints: QueryConstraint[] = [
          where("status", "==", "approved"),
          where("isPublic", "==", true),
          orderBy("createdAt", "desc"),
        ];

        // Fetch all matching photos (large batch for client-side filtering)
        const fetchLimit = 500;
        const dataConstraints = [...constraints, limit(fetchLimit)];

        const snap = await getDocs(query(photosRef, ...dataConstraints));
        const fetched: StockPhoto[] = [];
        snap.forEach((doc) => {
          const { imageUrl: _hiRes, ...safeData } = doc.data();
          fetched.push({ ...safeData, id: doc.id } as StockPhoto);
        });

        // ── Only show photos listed for sale (priceNPR > 0) ──
        // This filters out portfolio photos from Drishya or other sources
        // that share the same Firebase database but are not priced for sale.
        let filtered = fetched.filter((p) => (p.priceNPR || 0) > 0);

        // Client-side category filter
        if (selectedCategory) {
          filtered = filtered.filter((p) => p.category === selectedCategory);
        }

        // Client-side text search
        if (activeSearch) {
          const searchLower = activeSearch.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.title.toLowerCase().includes(searchLower) ||
              (p.description && p.description.toLowerCase().includes(searchLower)) ||
              (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchLower)))
          );
        }

        // Client-side price filter
        if (minPrice) {
          const min = parseInt(minPrice, 10);
          if (!isNaN(min)) filtered = filtered.filter((p) => p.priceNPR >= min);
        }
        if (maxPrice) {
          const max = parseInt(maxPrice, 10);
          if (!isNaN(max)) filtered = filtered.filter((p) => p.priceNPR <= max);
        }

        // Client-side sort
        filtered = sortPhotos(filtered, sortBy);

        // Set count from filtered results
        setTotalCount(filtered.length);
        setPhotos(filtered);
        setHasMore(false); // All results fetched at once
      } catch (err) {
        console.error("Error fetching photos:", err);
        toast.error("Failed to load photos. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, sortBy, activeSearch, minPrice, maxPrice, sortPhotos]
  );

  /* ── Fetch on filter change ── */
  useEffect(() => {
    setSearchInput(activeSearch);
    fetchPhotos(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery, urlTag, urlCategory, urlSort]);

  /* ── Sync URL params to local state ── */
  useEffect(() => {
    setSelectedCategory(urlCategory);
    setSortBy(urlSort);
  }, [urlCategory, urlSort]);

  /* ── Handlers ── */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL({ q: searchInput.trim(), tag: "" });
  };

  const handleCategoryChange = (cat: PhotoCategory | "") => {
    setSelectedCategory(cat);
    updateURL({ category: cat });
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    setShowSortDropdown(false);
    updateURL({ sort });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSelectedCategory("");
    setSortBy("newest");
    setMinPrice("");
    setMaxPrice("");
    router.push("/explore", { scroll: false });
  };

  const handleLoadMore = () => {
    fetchPhotos(true);
  };

  const handleAddToCart = (photo: StockPhoto) => {
    // Dispatch a custom event that the cart in layout can listen to
    const cartItem = {
      photoId: photo.id,
      title: photo.title,
      thumbnailUrl: photo.thumbnailUrl,
      priceNPR: photo.priceNPR,
      ownerName: photo.ownerName,
    };

    const existing = JSON.parse(localStorage.getItem("wildsaura_cart") || "[]");
    if (existing.some((item: { photoId: string }) => item.photoId === photo.id)) {
      toast("Already in cart", { icon: "🛒" });
      return;
    }
    existing.push(cartItem);
    localStorage.setItem("wildsaura_cart", JSON.stringify(existing));
    window.dispatchEvent(new Event("cart-updated"));
    toast.success(`"${photo.title}" added to cart!`);
  };

  const handleApplyPriceFilter = () => {
    fetchPhotos(false);
  };

  /* ── Active filter chips ── */
  const activeFilters = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = [];
    if (activeSearch) {
      chips.push({
        label: `"${activeSearch}"`,
        onRemove: () => {
          setSearchInput("");
          updateURL({ q: "", tag: "" });
        },
      });
    }
    if (selectedCategory) {
      const cat = CATEGORIES.find((c) => c.value === selectedCategory);
      chips.push({
        label: `${cat?.icon || ""} ${cat?.label || selectedCategory}`,
        onRemove: () => handleCategoryChange(""),
      });
    }
    if (minPrice || maxPrice) {
      const label =
        minPrice && maxPrice
          ? `NPR ${minPrice} – ${maxPrice}`
          : minPrice
          ? `NPR ${minPrice}+`
          : `Up to NPR ${maxPrice}`;
      chips.push({
        label,
        onRemove: () => {
          setMinPrice("");
          setMaxPrice("");
          fetchPhotos(false);
        },
      });
    }
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearch, selectedCategory, minPrice, maxPrice]);

  const sortLabel = SORT_OPTIONS.find((s) => s.value === sortBy)?.label || "Newest";

  return (
    <main className="min-h-screen bg-brand-light">
      {/* ──────────────────── STICKY FILTER BAR ──────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Row 1: Search + Sort */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search photos, tags, photographers..."
                className="w-full pl-11 pr-4 py-3 bg-surface-muted rounded-xl text-sm text-brand-dark placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-brand-primary/30 transition-shadow"
              />
            </form>

            {/* Filter Toggle (mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "lg:hidden flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors",
                showFilters
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>

            {/* Sort Dropdown */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white text-sm font-medium text-gray-600 transition-colors whitespace-nowrap"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortLabel}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {showSortDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-48 z-20">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleSortChange(opt.value)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm transition-colors",
                          sortBy === opt.value
                            ? "bg-brand-primary/10 text-brand-primary font-semibold"
                            : "text-gray-600 hover:bg-surface-muted"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Row 2: Category pills (desktop) + Filters (mobile expandable) */}
          <div className={cn("mt-3 hidden lg:block")}>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleCategoryChange("")}
                className={cn(
                  "text-sm font-medium px-4 py-2 rounded-full transition-all duration-200",
                  !selectedCategory
                    ? "bg-brand-primary text-white shadow-sm"
                    : "bg-surface-muted text-gray-600 hover:bg-gray-200"
                )}
              >
                All Categories
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={cn(
                    "text-sm font-medium px-4 py-2 rounded-full transition-all duration-200",
                    selectedCategory === cat.value
                      ? "bg-brand-primary text-white shadow-sm"
                      : "bg-surface-muted text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}

              {/* Price range */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Price:</span>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-20 px-3 py-2 text-xs bg-surface-muted rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
                <span className="text-gray-300">–</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-20 px-3 py-2 text-xs bg-surface-muted rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
                <button
                  onClick={handleApplyPriceFilter}
                  className="text-xs font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Mobile filters panel */}
          {showFilters && (
            <div className="mt-3 lg:hidden space-y-4 pb-2">
              {/* Categories */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Category
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCategoryChange("")}
                    className={cn(
                      "text-xs font-medium px-3 py-1.5 rounded-full transition-all",
                      !selectedCategory
                        ? "bg-brand-primary text-white"
                        : "bg-surface-muted text-gray-600"
                    )}
                  >
                    All
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => handleCategoryChange(cat.value)}
                      className={cn(
                        "text-xs font-medium px-3 py-1.5 rounded-full transition-all",
                        selectedCategory === cat.value
                          ? "bg-brand-primary text-white"
                          : "bg-surface-muted text-gray-600"
                      )}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort (mobile) */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Sort By
                </h4>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSortChange(opt.value)}
                      className={cn(
                        "text-xs font-medium px-3 py-1.5 rounded-full transition-all",
                        sortBy === opt.value
                          ? "bg-brand-primary text-white"
                          : "bg-surface-muted text-gray-600"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range (mobile) */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Price Range (NPR)
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="flex-1 px-3 py-2 text-sm bg-surface-muted rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                  <span className="text-gray-300">–</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="flex-1 px-3 py-2 text-sm bg-surface-muted rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                  <button
                    onClick={handleApplyPriceFilter}
                    className="text-sm font-semibold text-brand-primary"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────── RESULTS AREA ──────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            {activeSearch ? (
              <h1 className="text-lg font-semibold text-brand-dark">
                {loading ? (
                  "Searching..."
                ) : (
                  <>
                    <span className="text-gray-400 font-normal">
                      {photos.length} result{photos.length !== 1 ? "s" : ""} for{" "}
                    </span>
                    &ldquo;{activeSearch}&rdquo;
                  </>
                )}
              </h1>
            ) : (
              <h1 className="text-lg font-semibold text-brand-dark">
                {loading ? (
                  "Loading photos..."
                ) : (
                  <>
                    Showing{" "}
                    <span className="text-brand-primary">{photos.length}</span>{" "}
                    of {totalCount.toLocaleString()} photos
                  </>
                )}
              </h1>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilters.map((chip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary text-xs font-medium pl-3 pr-1.5 py-1.5 rounded-full"
                >
                  {chip.label}
                  <button
                    onClick={chip.onRemove}
                    className="p-0.5 hover:bg-brand-primary/20 rounded-full transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={handleClearFilters}
                className="text-xs text-gray-400 hover:text-brand-accent font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ──────── Photo Grid ──────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : photos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onAddToCart={handleAddToCart}
                  onQuickView={setQuickViewPhoto}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 bg-white hover:bg-surface-muted border border-gray-200 text-brand-dark font-semibold px-8 py-3.5 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Photos"
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          /* ──────── Empty State ──────── */
          <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="w-24 h-24 rounded-full bg-surface-muted flex items-center justify-center mb-6">
              <ImageOff className="h-10 w-10 text-gray-300" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-brand-dark mb-2">
              No Photos Found
            </h2>
            <p className="text-gray-400 text-center max-w-md mb-6">
              {activeSearch
                ? `We couldn't find any photos matching "${activeSearch}". Try different keywords or browse all categories.`
                : "No photos match your current filters. Try adjusting or clearing them."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-surface-muted text-gray-600 font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Go Home
              </Link>
            </div>

            {/* Suggested categories */}
            <div className="mt-10">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3 text-center">
                Popular Categories
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {CATEGORIES.slice(0, 4).map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoryChange(cat.value)}
                    className="text-sm bg-surface-muted hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-full transition-colors"
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ──────── Quick View Modal ──────── */}
      {quickViewPhoto && (
        <QuickViewModal
          photo={quickViewPhoto}
          onClose={() => setQuickViewPhoto(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </main>
  );
}

/* ═══════════════════════════════════════════════
   EXPLORE PAGE (with Suspense boundary for useSearchParams)
   ═══════════════════════════════════════════════ */
export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-brand-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </main>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
