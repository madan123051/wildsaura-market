"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Filter,
  ChevronRight,
  Star,
  MapPin,
  DollarSign,
} from "lucide-react";
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

  // Fetch listings
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "equipmentListings"),
          where("status", "==", "active")
        );
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

  // Filter and sort listings
  useEffect(() => {
    let result = listings;

    // Search filter
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

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // Price filter
    result = result.filter((item) => item.priceNPR >= minPrice && item.priceNPR <= maxPrice);

    // Sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.priceNPR - b.priceNPR);
        break;
      case "price-high":
        result.sort((a, b) => b.priceNPR - a.priceNPR);
        break;
      case "popular":
        result.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case "newest":
      default:
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    setFilteredListings(result);
  }, [listings, searchQuery, selectedCategory, minPrice, maxPrice, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/shopping?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag className="w-8 h-8 text-brand-primary" />
            <h1 className="text-3xl font-bold text-brand-dark">Shop Equipment</h1>
          </div>
          <p className="text-gray-600 mb-6">Browse photography equipment, cameras, lenses, and more from fellow photographers</p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by brand, model, or keyword..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 sticky top-24">
              {/* Categories */}
              <div>
                <h3 className="font-semibold text-brand-dark mb-3">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedCategory === "all"
                        ? "bg-brand-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    All Categories
                  </button>
                  {EQUIPMENT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                        selectedCategory === cat.value
                          ? "bg-brand-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <span>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-brand-dark mb-4">Price Range (NPR)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600">Min Price</label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Max Price</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 text-sm">
                Showing {filteredListings.length} items
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="lg:hidden mb-6 bg-white rounded-lg shadow-sm p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-brand-dark mb-3">Categories</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedCategory === "all"
                          ? "bg-brand-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      All
                    </button>
                    {EQUIPMENT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm transition-colors",
                          selectedCategory === cat.value
                            ? "bg-brand-primary text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Listings Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No items found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setMinPrice(0);
                    setMaxPrice(500000);
                  }}
                  className="px-6 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary/90"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/shopping/${listing.id}`}
                    className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Image */}
                    <div className="relative aspect-square w-full bg-gray-200 overflow-hidden">
                      <Image
                        src={listing.thumbnailUrl}
                        alt={listing.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {listing.condition !== "new" && (
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-semibold text-brand-primary">
                          {listing.condition}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-primary transition-colors">
                        {listing.title}
                      </h3>

                      {listing.brand && (
                        <p className="text-xs text-gray-500 mt-1">{listing.brand} {listing.model && `• ${listing.model}`}</p>
                      )}

                      {/* Price and Location */}
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p className="text-lg font-bold text-brand-primary">₹{formatNPR(listing.priceNPR)}</p>
                        </div>
                        {listing.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {listing.location}
                          </div>
                        )}
                      </div>

                      {/* Seller */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        {listing.sellerAvatar && (
                          <Image
                            src={listing.sellerAvatar}
                            alt={listing.sellerName}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <div className="text-xs flex-1">
                          <p className="font-medium text-gray-900">{listing.sellerName}</p>
                          <p className="text-gray-500">{listing.salesCount} sales</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingPage;
