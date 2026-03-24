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
  ExternalLink,
} from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn, formatNPR } from "@/lib/utils";
import type { StockPhoto, PhotoCategory } from "@/types";

const DRISHYA_APP_URL =
  process.env.NEXT_PUBLIC_DRISHYA_APP_URL || "https://drishya.wildsaura.com";

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

/* ───────────── Animated Counter ───────────── */
function AnimatedCounter({ target, label, icon }: { target: number; label: string; icon: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (target <= 0 || hasAnimated) return;
    setHasAnimated(true);
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, hasAnimated]);

  return (
    <div className="flex flex-col items-center gap-2 px-6 py-4">
      <div className="text-brand-secondary">{icon}</div>
      <span className="text-3xl font-bold font-heading text-brand-dark">
        {count.toLocaleString()}+
      </span>
      <span className="text-sm text-gray-500 font-medium">{label}</span>
    </div>
  );
}

/* ───────────── Photo Card ───────────── */
function FeaturedPhotoCard({ photo }: { photo: StockPhoto }) {
  return (
    <Link href={`/explore?q=${encodeURIComponent(photo.title)}`} className="group block">
      <div className="relative overflow-hidden rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 group-hover:-translate-y-1">
        <div className="relative aspect-[4/3] w-full bg-surface-muted">
          <Image
            src={photo.thumbnailUrl || photo.imageUrl}
            alt={photo.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <h3 className="text-white font-semibold text-sm line-clamp-1">
              {photo.title}
            </h3>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-white/80 text-xs">
                by {photo.ownerName || "Photographer"}
              </span>
              <span className="bg-brand-secondary text-brand-dark text-xs font-bold px-2.5 py-1 rounded-full">
                {formatNPR(photo.priceNPR)}
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

/* ───────────── Category Card ───────────── */
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
          "relative bg-gradient-to-br p-6 h-44 flex flex-col justify-between",
          CATEGORY_GRADIENTS[category.value]
        )}
      >
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />

        <div className="relative z-10">
          <span className="text-4xl">{category.icon}</span>
        </div>
        <div className="relative z-10">
          <h3 className="text-white font-heading font-bold text-lg">
            {category.label}
          </h3>
          <p className="text-white/70 text-sm mt-0.5">{category.description}</p>
          <p className="text-white/90 text-xs font-medium mt-2">
            {count.toLocaleString()} photos
          </p>
        </div>
        <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ChevronRight className="h-4 w-4 text-white" />
        </div>
      </div>
    </Link>
  );
}

/* ───────────── Why WildSaura Feature Card ───────────── */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      <div className="w-14 h-14 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="font-heading font-bold text-xl text-brand-dark mb-3">
        {title}
      </h3>
      <p className="text-gray-500 leading-relaxed text-sm">{description}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HOME PAGE
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
      const baseConstraints = [
        where("status", "==", "approved"),
        where("isPublic", "==", true),
      ];

      // Total photos count
      const countSnap = await getCountFromServer(
        query(photosRef, ...baseConstraints)
      );
      setTotalPhotos(countSnap.data().count);

      // Featured photos (top by salesCount)
      const featuredQuery = query(
        photosRef,
        ...baseConstraints,
        orderBy("salesCount", "desc"),
        limit(8)
      );
      const featuredSnap = await getDocs(featuredQuery);
      const photos: StockPhoto[] = [];
      const ownerIds = new Set<string>();

      featuredSnap.forEach((doc) => {
        const data = doc.data() as Omit<StockPhoto, "id">;
        photos.push({ ...data, id: doc.id } as StockPhoto);
        ownerIds.add(data.ownerId);
      });
      setFeaturedPhotos(photos);

      // Total unique photographers — count from a broader query
      const allPhotosSnap = await getDocs(
        query(photosRef, ...baseConstraints, limit(500))
      );
      const allOwnerIds = new Set<string>();
      allPhotosSnap.forEach((doc) => {
        allOwnerIds.add(doc.data().ownerId);
      });
      setTotalPhotographers(allOwnerIds.size);

      // Category counts
      const counts: Record<string, number> = {};
      await Promise.all(
        CATEGORIES.map(async (cat) => {
          const catSnap = await getCountFromServer(
            query(photosRef, ...baseConstraints, where("category", "==", cat.value))
          );
          counts[cat.value] = catSnap.data().count;
        })
      );
      setCategoryCounts(counts);
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

  return (
    <main className="min-h-screen bg-brand-light">
      {/* ──────────────────── HERO ──────────────────── */}
      <section className="relative overflow-hidden bg-brand-dark">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(26,107,60,0.4),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(245,166,35,0.3),transparent_50%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-brand-secondary text-sm font-medium px-4 py-2 rounded-full mb-8">
            <Sparkles className="h-4 w-4" />
            Nepal&apos;s Premier Stock Photography Marketplace
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight max-w-4xl mx-auto">
            Discover Nepal&apos;s{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-secondary to-amber-300">
              Finest
            </span>{" "}
            Stock Photography
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Explore thousands of authentic, high-quality photos from Nepal&apos;s
            most talented photographers. From the Himalayas to Kathmandu streets.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="mt-10 max-w-2xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary rounded-2xl opacity-40 blur group-hover:opacity-60 transition-opacity duration-300" />
              <div className="relative flex items-center bg-white rounded-xl shadow-lg">
                <Search className="ml-5 h-5 w-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search thousands of stunning photos..."
                  className="flex-1 px-4 py-4 sm:py-5 text-brand-dark placeholder:text-gray-400 bg-transparent outline-none text-base sm:text-lg"
                />
                <button
                  type="submit"
                  className="mr-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Trending Tags */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="text-gray-400 text-sm mr-1">Trending:</span>
            {TRENDING_TAGS.map((tag) => (
              <Link
                key={tag}
                href={`/explore?tag=${encodeURIComponent(tag)}`}
                className="text-xs sm:text-sm text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all duration-200"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path
              d="M0 80V40C240 0 480 0 720 40C960 80 1200 80 1440 40V80H0Z"
              className="fill-brand-light"
            />
          </svg>
        </div>
      </section>

      {/* ──────────────────── STATS BAR ──────────────────── */}
      <section className="relative z-10 -mt-4 max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 flex flex-wrap items-center justify-center divide-x divide-gray-100">
          <AnimatedCounter
            target={totalPhotos}
            label="Stock Photos"
            icon={<ImageIcon className="h-6 w-6" />}
          />
          <AnimatedCounter
            target={totalPhotographers}
            label="Photographers"
            icon={<Users className="h-6 w-6" />}
          />
          <AnimatedCounter
            target={8}
            label="Categories"
            icon={<Grid3X3 className="h-6 w-6" />}
          />
          <AnimatedCounter
            target={featuredPhotos.reduce((sum, p) => sum + (p.salesCount || 0), 0)}
            label="Photos Sold"
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </div>
      </section>

      {/* ──────────────────── CATEGORY GRID ──────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-dark">
            Browse by Category
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto text-lg">
            Explore curated collections across eight unique categories
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.value}
              category={cat}
              count={categoryCounts[cat.value] || 0}
            />
          ))}
        </div>
      </section>

      {/* ──────────────────── FEATURED PHOTOS ──────────────────── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-brand-secondary text-sm font-semibold mb-3">
                <TrendingUp className="h-4 w-4" />
                TRENDING THIS WEEK
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-dark">
                Featured Photos
              </h2>
            </div>
            <Link
              href="/explore"
              className="hidden sm:inline-flex items-center gap-1.5 text-brand-primary hover:text-brand-primary/80 font-semibold text-sm transition-colors"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] bg-surface-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : featuredPhotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredPhotos.map((photo) => (
                <FeaturedPhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Photos coming soon!</p>
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
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

      {/* ──────────────────── SELL YOUR PHOTOS CTA ──────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-emerald-700 to-brand-dark" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-brand-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-brand-secondary text-sm font-medium px-4 py-2 rounded-full mb-6">
                <Camera className="h-4 w-4" />
                For Photographers
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Turn Your Photography Into{" "}
                <span className="text-brand-secondary">Income</span>
              </h2>
              <p className="mt-6 text-lg text-white/80 leading-relaxed max-w-lg">
                Join WildSaura Market and reach thousands of buyers looking for
                authentic Nepali photography. Upload through our Drishya platform,
                set your prices, and start earning from your passion.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
                  href={DRISHYA_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-brand-secondary hover:bg-amber-500 text-brand-dark font-bold px-8 py-4 rounded-xl transition-colors duration-200 text-base shadow-lg"
                >
                  Start Selling on Drishya
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl transition-colors duration-200 text-base border border-white/20"
                >
                  Browse Marketplace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <DollarSign className="h-8 w-8 text-brand-secondary mb-3" />
                  <h4 className="text-white font-bold text-lg">Fair Pricing</h4>
                  <p className="text-white/60 text-sm mt-1">
                    You set the price. Keep the majority of every sale.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <Zap className="h-8 w-8 text-brand-secondary mb-3" />
                  <h4 className="text-white font-bold text-lg">AI Quality Check</h4>
                  <p className="text-white/60 text-sm mt-1">
                    Automated scoring ensures only the best photos go live.
                  </p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <Globe className="h-8 w-8 text-brand-secondary mb-3" />
                  <h4 className="text-white font-bold text-lg">Global Reach</h4>
                  <p className="text-white/60 text-sm mt-1">
                    Sell to buyers worldwide. Your photos, your audience.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <Shield className="h-8 w-8 text-brand-secondary mb-3" />
                  <h4 className="text-white font-bold text-lg">Secure Platform</h4>
                  <p className="text-white/60 text-sm mt-1">
                    Protected downloads and verified purchases only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────── WHY WILDSAURA ──────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-dark">
            Why WildSaura?
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto text-lg">
            Built for Nepal&apos;s photography community, designed for the world
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Sparkles className="h-7 w-7 text-brand-primary" />}
            title="AI-Powered Quality"
            description="Every photo is analyzed by our AI for sharpness, composition, and market appeal — ensuring a premium marketplace."
          />
          <FeatureCard
            icon={<Globe className="h-7 w-7 text-brand-primary" />}
            title="Nepal-Focused"
            description="The only stock marketplace dedicated to authentic Nepali photography — from the Himalayas to heritage sites."
          />
          <FeatureCard
            icon={<DollarSign className="h-7 w-7 text-brand-primary" />}
            title="Fair for Creators"
            description="Photographers set their own prices and keep the lion's share. No hidden fees, no unfair commissions."
          />
          <FeatureCard
            icon={<Rocket className="h-7 w-7 text-brand-primary" />}
            title="Partner Integration"
            description="Coming soon: syndicate your photos to Shutterstock, Adobe Stock, and other global platforms through WildSaura."
          />
        </div>
      </section>

      {/* ──────────────────── FOOTER CTA ──────────────────── */}
      <section className="bg-brand-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
            Join Thousands of{" "}
            <span className="text-brand-secondary">Photographers</span>
          </h2>
          <p className="mt-5 text-gray-400 text-lg max-w-xl mx-auto">
            Whether you&apos;re buying stunning visuals or selling your best shots,
            WildSaura is the marketplace for you.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold px-8 py-4 rounded-xl transition-colors duration-200 text-base"
            >
              <ShoppingCart className="h-5 w-5" />
              Browse Photos
            </Link>
            <a
              href={DRISHYA_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors duration-200 text-base border border-white/20"
            >
              <Camera className="h-5 w-5" />
              Start Selling
              <ExternalLink className="h-4 w-4 ml-0.5" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
