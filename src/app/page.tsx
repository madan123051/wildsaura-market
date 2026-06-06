"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Camera,
  TrendingUp,
  Users,
  Grid3X3,
  ImageIcon,
  Sparkles,
  Globe,
  DollarSign,
  Rocket,
  ArrowRight,
  ChevronRight,
  Eye,
  ShoppingCart,
  Star,
  Zap,
  Shield,
  Package,
  Wrench,
} from "lucide-react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn, formatNPR } from "@/lib/utils";
import type { StockPhoto, PhotoCategory } from "@/types";

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

const TRENDING_TAGS = [
  "Himalayas",
  "Kathmandu",
  "Pokhara",
  "Wildlife",
  "Festival",
  "Temple",
  "Trekking",
  "Rhododendron",
  "Sunrise",
  "Nepal Culture",
];

const CATEGORY_GRADIENTS: Record<string, string> = {
  nature: "from-emerald-500 to-green-700",
  wildlife: "from-amber-500 to-orange-700",
  landscape: "from-sky-500 to-blue-700",
  culture: "from-rose-500 to-pink-700",
  adventure: "from-red-500 to-rose-700",
  street: "from-violet-500 to-purple-700",
  aerial: "from-cyan-500 to-teal-700",
  macro: "from-lime-500 to-emerald-700",
};

/* ───────────── Photo Card ───────────── */
function FeaturedPhotoCard({ photo }: { photo: StockPhoto }) {
  return (
    <Link href={`/photo/${photo.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 group-hover:-translate-y-1">
        <div className="relative aspect-[4/3] w-full bg-surface-muted">
          <Image
            src={photo.thumbnailUrl}
            alt={photo.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            quality={30}
          />
          {/* Protect overlay */}
          <div className="absolute inset-0 z-[2]" onContextMenu={(e) => e.preventDefault()} />
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <h3 className="text-white font-semibold text-sm line-clamp-1">
              {photo.title || "Untitled"}
            </h3>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-white/80 text-xs">
                by {photo.ownerName || "Photographer"}
              </span>
              <span className="bg-brand-secondary text-brand-dark text-xs font-bold px-2.5 py-1 rounded-full">
                {formatNPR(photo.priceNPR || 0)}
              </span>
            </div>
          </div>
          {/* Quality Badge */}
          {photo.qualityScore && photo.qualityScore >= 8 && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-brand-secondary/90 backdrop-blur-sm text-brand-dark text-xs font-bold px-2 py-1 rounded-full">
              <Star className="h-3 w-3" />
              Premium
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ───────────── Category Card (compact) ───────────── */
function CategoryCard({
  category,
  count,
}: {
  category: (typeof CATEGORIES)[number];
  count: number;
}) {
  return (
    <Link
      href={`/explore?category=${category.value}`}
      className="group relative overflow-hidden rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
    >
      <div
        className={cn(
          "relative bg-gradient-to-br p-5 h-36 flex flex-col justify-between",
          CATEGORY_GRADIENTS[category.value]
        )}
      >
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />

        <div className="relative z-10">
          <span className="text-3xl">{category.icon}</span>
        </div>
        <div className="relative z-10">
          <h3 className="text-white font-heading font-bold text-base">
            {category.label}
          </h3>
          <p className="text-white/90 text-xs font-medium mt-1">
            {count.toLocaleString()} photos
          </p>
        </div>
        <div className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ChevronRight className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════
   HOME PAGE — Marketplace-First Design
   75% Photo Sell · 25% Equipment Sell
   ═══════════════════════════════════════════════ */
export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalPhotographers, setTotalPhotographers] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [featuredPhotos, setFeaturedPhotos] = useState<StockPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Fetch data on mount ── */
  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);
      const photosRef = collection(db, "photos");

      // Fetch ALL photos without orderBy — avoids any index issues
      const allSnap = await getDocs(photosRef);

      const listedPhotos: StockPhoto[] = [];
      const approvedPhotos: StockPhoto[] = [];
      const ownerIds = new Set<string>();
      const counts: Record<string, number> = {};

      allSnap.forEach((d) => {
        const raw = d.data();

        // Only count photos that are priced for sale (priceNPR > 0)
        if (!raw.priceNPR || raw.priceNPR <= 0) {
          return;
        }
        
        const photo = { ...raw, id: d.id } as StockPhoto;
        
        listedPhotos.push(photo);
        ownerIds.add(photo.ownerId);

        const cat = (photo.category || "").toLowerCase();
        if (cat) counts[cat] = (counts[cat] || 0) + 1;

        if (
          photo.status === "approved" &&
          photo.isPublic !== false &&
          photo.thumbnailUrl &&
          photo.title
        ) {
          approvedPhotos.push(photo);
        }
      });

      setTotalPhotos(listedPhotos.length);
      setTotalPhotographers(ownerIds.size);
      setCategoryCounts(counts);

      const sorted = [...approvedPhotos].sort(
        (a, b) => (b.salesCount || 0) - (a.salesCount || 0)
      );
      setFeaturedPhotos(sorted.slice(0, 12));
    } catch (err) {
      console.error("Error fetching home data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const topPhotos = featuredPhotos.slice(0, 4);
  const morePhotos = featuredPhotos.slice(4, 12);

  return (
    <main className="min-h-screen bg-brand-light">

      {/* ═══════════════════════════════════════════
          SECTION 1: COMPACT HERO + SEARCH (selling-first)
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(26,107,60,0.4),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(245,166,35,0.3),transparent_50%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pt-14 sm:pb-20">
          {/* Top mini-nav selling links */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 mb-8">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 bg-brand-primary/80 hover:bg-brand-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors duration-200"
            >
              <ImageIcon className="h-4 w-4" />
              Buy Photos
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-brand-secondary hover:bg-amber-500 text-brand-dark text-sm font-semibold px-5 py-2.5 rounded-full transition-colors duration-200"
            >
              <Camera className="h-4 w-4" />
              Sell Photos
            </Link>
            <Link
              href="/shopping"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors duration-200 border border-white/20"
            >
              <Package className="h-4 w-4" />
              Equipment
            </Link>
          </div>

          {/* Compact title */}
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight text-center max-w-3xl mx-auto">
            Buy & Sell{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-secondary to-amber-300">
              Nepal&apos;s Best
            </span>{" "}
            Photography
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-300 text-center max-w-xl mx-auto">
            {totalPhotos > 0 ? `${totalPhotos.toLocaleString()} photos` : "Thousands of photos"} from {totalPhotographers > 0 ? `${totalPhotographers.toLocaleString()} photographers` : "talented photographers"} — ready to buy now.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-7 max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary rounded-2xl opacity-40 blur group-hover:opacity-60 transition-opacity duration-300" />
              <div className="relative flex items-center bg-white rounded-xl shadow-lg">
                <Search className="ml-5 h-5 w-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search photos — nature, wildlife, Himalayas..."
                  className="flex-1 px-4 py-3.5 sm:py-4 text-brand-dark placeholder:text-gray-400 bg-transparent outline-none text-base"
                />
                <button
                  type="submit"
                  className="mr-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors duration-200 text-sm"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Trending Tags */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-gray-400 text-xs mr-1">Trending:</span>
            {TRENDING_TAGS.slice(0, 6).map((tag) => (
              <Link
                key={tag}
                href={`/explore?tag=${encodeURIComponent(tag)}`}
                className="text-xs text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full transition-all duration-200"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full">
            <path
              d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z"
              className="fill-brand-light"
            />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2: TOP SELLING PHOTOS — Hero Grid (75% focus)
          Immediately visible, no scrolling needed
          ═══════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
              <Zap className="h-3.5 w-3.5" />
              Hot
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-dark">
              Top Selling Photos
            </h2>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-brand-primary hover:text-brand-primary/80 font-semibold text-sm transition-colors"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="aspect-[4/3] bg-surface-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : topPhotos.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {topPhotos.map((photo) => (
              <FeaturedPhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Camera className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-base">Photos coming soon!</p>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3: CATEGORIES (quick-browse strip)
          ═══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-dark">
            Browse Categories
          </h2>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-brand-primary hover:text-brand-primary/80 font-semibold text-sm transition-colors"
          >
            All Categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.value}
              category={cat}
              count={categoryCounts[cat.value] || 0}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4: MORE FEATURED PHOTOS
          ═══════════════════════════════════════════ */}
      {morePhotos.length > 0 && (
        <section className="bg-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 text-brand-secondary text-xs font-semibold mb-2 uppercase tracking-wide">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Trending This Week
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-dark">
                  More Photos to Explore
                </h2>
              </div>
              <Link
                href="/explore"
                className="hidden sm:inline-flex items-center gap-1.5 text-brand-primary hover:text-brand-primary/80 font-semibold text-sm transition-colors"
              >
                Explore All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {morePhotos.map((photo) => (
                <FeaturedPhotoCard key={photo.id} photo={photo} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/explore"
                className="inline-flex items-center gap-1.5 text-brand-primary font-semibold"
              >
                View All Photos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          SECTION 5: SELL YOUR PHOTOS — CTA Banner
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-emerald-700 to-brand-dark" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-brand-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-brand-secondary text-sm font-medium px-4 py-2 rounded-full mb-5">
                <Camera className="h-4 w-4" />
                For Photographers
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white leading-tight">
                Turn Your Photos Into{" "}
                <span className="text-brand-secondary">Income</span>
              </h2>
              <p className="mt-4 text-base text-white/80 leading-relaxed max-w-lg">
                Upload your best shots, set your price, and sell on WildSaura.
                Reach buyers looking for authentic Nepali photography.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/upload"
                  className="inline-flex items-center justify-center gap-2 bg-brand-secondary hover:bg-amber-500 text-brand-dark font-bold px-7 py-3.5 rounded-xl text-sm shadow-lg transition-colors duration-200"
                >
                  <Camera className="h-4 w-4" />
                  Start Selling Photos
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-7 py-3.5 rounded-xl transition-colors duration-200 text-sm border border-white/20"
                >
                  Browse Marketplace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                  <DollarSign className="h-7 w-7 text-brand-secondary mb-2" />
                  <h4 className="text-white font-bold text-base">Fair Pricing</h4>
                  <p className="text-white/60 text-sm mt-1">
                    You set the price. Keep the majority of every sale.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                  <Zap className="h-7 w-7 text-brand-secondary mb-2" />
                  <h4 className="text-white font-bold text-base">AI Quality Check</h4>
                  <p className="text-white/60 text-sm mt-1">
                    Automated scoring ensures only the best photos go live.
                  </p>
                </div>
              </div>
              <div className="space-y-3 mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                  <Globe className="h-7 w-7 text-brand-secondary mb-2" />
                  <h4 className="text-white font-bold text-base">Global Reach</h4>
                  <p className="text-white/60 text-sm mt-1">
                    Sell to buyers worldwide. Your photos, your audience.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                  <Shield className="h-7 w-7 text-brand-secondary mb-2" />
                  <h4 className="text-white font-bold text-base">Secure Platform</h4>
                  <p className="text-white/60 text-sm mt-1">
                    Protected downloads and verified purchases only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6: EQUIPMENT MARKETPLACE (25% focus)
          ═══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
          <div className="grid lg:grid-cols-5 gap-0">
            {/* Left: Info (2/5) */}
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 p-8 sm:p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full mb-5 w-fit uppercase tracking-wide">
                <Package className="h-3.5 w-3.5" />
                Equipment Store
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white leading-tight">
                Buy & Sell Camera Equipment
              </h2>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">
                Find cameras, lenses, tripods, drones, and accessories from trusted sellers. Sell your gear to fellow photographers.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/shopping"
                  className="inline-flex items-center justify-center gap-2 bg-brand-secondary hover:bg-amber-500 text-brand-dark font-bold px-6 py-3 rounded-xl text-sm transition-colors duration-200"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Browse Equipment
                </Link>
                <Link
                  href="/equipment/sell"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors duration-200 border border-white/20"
                >
                  <Wrench className="h-4 w-4" />
                  Sell Your Gear
                </Link>
              </div>
            </div>

            {/* Right: Equipment categories grid (3/5) */}
            <div className="lg:col-span-3 p-8 sm:p-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: "📷", label: "Cameras", desc: "DSLR, Mirrorless, Compact" },
                  { icon: "🔭", label: "Lenses", desc: "Wide, Tele, Macro, Prime" },
                  { icon: "📐", label: "Tripods", desc: "Travel, Studio, Monopods" },
                  { icon: "🚁", label: "Drones", desc: "DJI, FPV, Accessories" },
                  { icon: "💡", label: "Lighting", desc: "Flash, LED, Softbox" },
                  { icon: "🎒", label: "Accessories", desc: "Bags, Filters, Cards" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={`/shopping?category=${item.label.toLowerCase()}`}
                    className="group bg-gray-50 hover:bg-brand-primary/5 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <h4 className="mt-2 font-bold text-sm text-brand-dark group-hover:text-brand-primary transition-colors">
                      {item.label}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 7: WHY WILDSAURA (compact)
          ═══════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-dark">
              Why WildSaura?
            </h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto text-base">
              Built for Nepal&apos;s photography community, designed for the world
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Sparkles className="h-6 w-6 text-brand-primary" />,
                title: "AI-Powered Quality",
                desc: "Every photo is analyzed for sharpness, composition, and market appeal.",
              },
              {
                icon: <Globe className="h-6 w-6 text-brand-primary" />,
                title: "Nepal-Focused",
                desc: "The only stock marketplace dedicated to authentic Nepali photography.",
              },
              {
                icon: <DollarSign className="h-6 w-6 text-brand-primary" />,
                title: "Fair for Creators",
                desc: "Set your own prices and keep the lion's share. No hidden fees.",
              },
              {
                icon: <Rocket className="h-6 w-6 text-brand-primary" />,
                title: "Partner Integration",
                desc: "Coming soon: syndicate to Shutterstock, Adobe Stock, and more.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-brand-light rounded-2xl p-6 hover:shadow-card transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-heading font-bold text-lg text-brand-dark mb-2">
                  {f.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 8: FOOTER CTA
          ═══════════════════════════════════════════ */}
      <section className="bg-brand-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            Start Buying or Selling{" "}
            <span className="text-brand-secondary">Today</span>
          </h2>
          <p className="mt-4 text-gray-400 text-base max-w-xl mx-auto">
            Join Nepal&apos;s growing marketplace for stock photography and camera equipment.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold px-7 py-3.5 rounded-xl transition-colors duration-200 text-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              Buy Photos
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-brand-secondary hover:bg-amber-500 text-brand-dark font-bold px-7 py-3.5 rounded-xl transition-colors duration-200 text-sm"
            >
              <Camera className="h-4 w-4" />
              Sell Photos
            </Link>
            <Link
              href="/shopping"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors duration-200 text-sm border border-white/20"
            >
              <Package className="h-4 w-4" />
              Equipment Store
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
