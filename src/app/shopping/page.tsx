"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingBag, Filter, MapPin, SlidersHorizontal, X } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn, formatNPR } from "@/lib/utils";
import type { EquipmentListing, EquipmentCategory } from "@/types";
import { EQUIPMENT_CATEGORIES } from "@/types";
import Image from "next/image";

function ShoppingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<EquipmentListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<EquipmentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | "all">(
    (searchParams.get("category") as EquipmentCategory) || "all"
  );
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "popular">("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "equipmentListings"), where("status", "==", "active"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as EquipmentListing[];
        setListings(data);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  useEffect(() => {
    let result = listings;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.brand?.toLowerCase().includes(q) ||
          item.model?.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    if (selectedCategory !== "all") result = result.filter((i) => i.category === selectedCategory);
    result = result.filter((i) => i.priceNPR >= minPrice && i.priceNPR <= maxPrice);
    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.priceNPR - b.priceNPR); break;
      case "price-high": result.sort((a, b) => b.priceNPR - a.priceNPR); break;
      case "popular": result.sort((a, b) => b.viewCount - a.viewCount); break;
      default: result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    setFilteredListings(result);
  }, [listings, searchQuery, selectedCategory, minPrice, maxPrice, sortBy]);

  const conditionBadge = (condition: string) => {
    if (condition === "like-new") return { label: "Like New", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" };
    if (condition === "used") return { label: "Used", cls: "bg-blue-500/15 text-blue-400 border-blue-500/20" };
    return { label: "Fair", cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-transparent to-cyan-950/20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-2">WildSaura Market</p>
              <h1 className="text-4xl font-black tracking-tight">Shop Equipment</h1>
              <p className="text-gray-500 mt-1 text-sm">Photography gear from verified creators</p>
            </div>
            <Link
              href="/shopping/sell"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:shadow-xl hover:shadow-violet-500/20 transition-all shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              Sell Equipment
            </Link>
          </div>

          {/* Search */}
          <div className="flex gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) router.push(`/shopping?q=${encodeURIComponent(searchQuery.trim())}`);
              }}
              className="flex-1 relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by brand, model, keyword…"
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.05] border border-white/10 rounded-2xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.07] transition"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-3.5 rounded-2xl border text-sm font-semibold transition",
                showFilters
                  ? "bg-violet-500/20 border-violet-500/30 text-violet-300"
                  : "bg-white/[0.05] border-white/10 text-gray-400 hover:bg-white/[0.08]"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3.5 bg-white/[0.05] border border-white/10 rounded-2xl text-sm text-gray-400 focus:outline-none focus:border-violet-500/40 transition appearance-none"
            >
              <option value="newest" className="bg-[#1a1a2e]">Newest</option>
              <option value="price-low" className="bg-[#1a1a2e]">Price ↑</option>
              <option value="price-high" className="bg-[#1a1a2e]">Price ↓</option>
              <option value="popular" className="bg-[#1a1a2e]">Popular</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0 space-y-6">
            {/* Categories */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Category</p>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition",
                    selectedCategory === "all"
                      ? "bg-violet-500/20 text-violet-300"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  )}
                >
                  All Categories
                </button>
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2",
                      selectedCategory === cat.value
                        ? "bg-violet-500/20 text-violet-300"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    )}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="pt-4 border-t border-white/5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Price (NPR)</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Min</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/40 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Max</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/40 transition"
                  />
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {/* Mobile filters */}
            {showFilters && (
              <div className="lg:hidden mb-6 p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Category</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition border",
                        selectedCategory === "all" ? "bg-violet-500/20 text-violet-300 border-violet-500/30" : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10")}
                    >All</button>
                    {EQUIPMENT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition border",
                          selectedCategory === cat.value ? "bg-violet-500/20 text-violet-300 border-violet-500/30" : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10")}
                      >{cat.icon} {cat.label}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Min Price</label>
                    <input type="number" value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Max Price</label>
                    <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Count bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                {loading ? "Loading…" : <><span className="text-white font-semibold">{filteredListings.length}</span> items found</>}
              </p>
              {(selectedCategory !== "all" || searchQuery) && (
                <button
                  onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setMinPrice(0); setMaxPrice(500000); }}
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-white/5" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-white/5 rounded-full w-3/4" />
                      <div className="h-3 bg-white/5 rounded-full w-1/2" />
                      <div className="h-5 bg-white/5 rounded-full w-1/3 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-3xl mb-4">
                  🔍
                </div>
                <h3 className="text-lg font-bold text-gray-300 mb-2">No items found</h3>
                <p className="text-gray-600 text-sm mb-6">Try adjusting your search or filters</p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setMinPrice(0); setMaxPrice(500000); }}
                  className="px-6 py-2.5 rounded-full bg-violet-500/20 text-violet-300 text-sm font-semibold border border-violet-500/20 hover:bg-violet-500/30 transition"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredListings.map((listing) => {
                  const badge = conditionBadge(listing.condition);
                  return (
                    <Link
                      key={listing.id}
                      href={`/shopping/${listing.id}`}
                      className="group block rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-violet-500/30 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/10"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] w-full bg-black/20 overflow-hidden">
                        <Image
                          src={listing.thumbnailUrl}
                          alt={listing.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        {/* Condition badge */}
                        <div className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold border", badge.cls)}>
                          {badge.label}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-200 line-clamp-1 group-hover:text-white transition-colors text-sm">
                          {listing.title}
                        </h3>
                        {(listing.brand || listing.model) && (
                          <p className="text-xs text-gray-600 mt-0.5">{listing.brand}{listing.model ? ` · ${listing.model}` : ""}</p>
                        )}

                        {/* Price row */}
                        <div className="flex items-end justify-between mt-3">
                          <p className="text-xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                            ₹{formatNPR(listing.priceNPR)}
                          </p>
                          {listing.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[80px]">{listing.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Seller */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                          {listing.sellerAvatar ? (
                            <Image
                              src={listing.sellerAvatar}
                              alt={listing.sellerName}
                              width={22}
                              height={22}
                              className="w-5 h-5 rounded-full ring-1 ring-white/10 object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white">
                              {listing.sellerName?.[0] || "?"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <p className="text-xs text-gray-500 truncate">{listing.sellerName}</p>
                            {listing.isVerified && (
                              <span className="text-[10px] text-violet-400 font-bold flex items-center gap-0.5 shrink-0">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingPage;
