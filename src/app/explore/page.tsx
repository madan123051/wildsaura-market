"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ImageGrid } from "@/components/photo/ImageGrid";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/hooks/useCart";
import type { StockPhoto, PhotoCategory, CartItem } from "@/types";

const CATEGORIES: { label: string; value: PhotoCategory | "all" }[] = [
  { label: "All",          value: "all" },
  { label: "🌿 Nature",    value: "nature" },
  { label: "🦅 Wildlife",  value: "wildlife" },
  { label: "🏛️ Culture",   value: "culture" },
  { label: "🍜 Food",      value: "food" },
  { label: "🧗 Adventure", value: "adventure" },
  { label: "🕌 Architecture", value: "architecture" },
  { label: "👥 People",    value: "people" },
  { label: "✈️ Aerial",    value: "aerial" },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const [photos,       setPhotos]      = useState<StockPhoto[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [searchQuery,  setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<PhotoCategory | "all">(
    (searchParams.get("category") as PhotoCategory) ?? "all"
  );

  const { addToCart, count } = useCart();

  useEffect(() => {
    fetchPhotos();
  }, [activeCategory]);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, "photos"),
        where("status", "==", "approved"),
        where("isPublic", "==", true),
        orderBy("createdAt", "desc"),
        limit(40)
      );
      if (activeCategory !== "all") {
        q = query(
          collection(db, "photos"),
          where("status", "==", "approved"),
          where("isPublic", "==", true),
          where("category", "==", activeCategory),
          orderBy("createdAt", "desc"),
          limit(40)
        );
      }
      const snap = await getDocs(q);
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockPhoto)));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = photos.filter((p) =>
    searchQuery ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) : true
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar cartCount={count} />

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-brand-dark">Explore Photos</h1>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} photos found</p>
          </div>
          <div className="w-full md:w-80">
            <Input
              placeholder="Search photos, tags…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.value
                  ? "bg-brand-primary text-white shadow-sm"
                  : "bg-white border border-surface-border text-gray-600 hover:border-brand-primary/40"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl2 bg-surface-muted aspect-[4/3] animate-pulse" />
            ))}
          </div>
        ) : (
          <ImageGrid
            photos={filtered}
            onAddToCart={(item: CartItem) => addToCart(item)}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ExploreContent />
    </Suspense>
  );r
}
