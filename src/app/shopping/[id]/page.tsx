"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Heart,
  Share2,
  MapPin,
  User,
  Phone,
  Mail,
  Tag,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatNPR } from "@/lib/utils";
import type { EquipmentListing } from "@/types";

function EquipmentDetailPage() {
  const params = useParams();
  const equipmentId = params.id as string;
  const [listing, setListing] = useState<EquipmentListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docRef = doc(db, "equipmentListings", equipmentId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setListing({
            id: snapshot.id,
            ...snapshot.data(),
            createdAt: snapshot.data().createdAt?.toDate() || new Date(),
            updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
          } as EquipmentListing);
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };

    if (equipmentId) {
      fetchListing();
    }
  }, [equipmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-brand-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/shopping" className="flex items-center gap-2 text-brand-primary hover:underline mb-8">
            <ChevronLeft className="w-4 h-4" />
            Back to Shopping
          </Link>
          <div className="bg-white rounded-lg p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Item not found</h1>
            <p className="text-gray-600 mb-6">The equipment listing you're looking for doesn't exist.</p>
            <Link href="/shopping" className="inline-block px-6 py-2 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary/90">
              Back to Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = listing.imageUrls || [listing.thumbnailUrl];
  const conditionColor: Record<string, string> = {
    new: "bg-green-100 text-green-800",
    "like-new": "bg-blue-100 text-blue-800",
    used: "bg-yellow-100 text-yellow-800",
    refurbished: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/shopping" className="flex items-center gap-2 text-brand-primary hover:underline mb-6 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Back to Shopping
        </Link>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Images */}
          <div>
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-sm mb-4">
              <Image
                src={images[currentImageIndex]}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />

              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImageIndex(
                        currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur hover:bg-white rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImageIndex(
                        currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur hover:bg-white rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === currentImageIndex ? "border-brand-primary" : "border-gray-200"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${listing.title} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {/* Condition Badge */}
            <div className="inline-block mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${conditionColor[listing.condition] || "bg-gray-100 text-gray-800"}`}>
                {listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>

            {/* Brand & Model */}
            {(listing.brand || listing.model) && (
              <p className="text-gray-600 mb-6">
                {listing.brand} {listing.model && `• ${listing.model}`}
              </p>
            )}

            {/* Price */}
            <div className="mb-6 pb-6 border-b">
              <p className="text-4xl font-bold text-brand-primary">₹{formatNPR(listing.priceNPR)}</p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>

            {/* Specifications */}
            {(listing.yearPurchased || listing.tag) && (
              <div className="mb-6 p-4 bg-white rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Details</h2>
                <div className="space-y-2 text-sm">
                  {listing.yearPurchased && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year Purchased:</span>
                      <span className="font-medium text-gray-900">{listing.yearPurchased}</span>
                    </div>
                  )}
                  {listing.location && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location:
                      </span>
                      <span className="font-medium text-gray-900">{listing.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {listing.tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button className="flex-1 bg-brand-primary text-white py-3 rounded-lg font-semibold hover:bg-brand-primary/90 transition-colors">
                Contact Seller
              </button>
              <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Heart className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
              </button>
              <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h2>
          <div className="flex items-center gap-4">
            {listing.sellerAvatar && (
              <Image
                src={listing.sellerAvatar}
                alt={listing.sellerName}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {listing.sellerName}
                {listing.isVerified && <Check className="w-5 h-5 text-green-600" />}
              </h3>
              <p className="text-gray-600 mb-3">{listing.salesCount} successful sales</p>
              <div className="flex gap-4 text-sm">
                {listing.sellerEmail && (
                  <a href={`mailto:${listing.sellerEmail}`} className="flex items-center gap-2 text-brand-primary hover:underline">
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                )}
                {listing.sellerPhone && (
                  <a href={`tel:${listing.sellerPhone}`} className="flex items-center gap-2 text-brand-primary hover:underline">
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipmentDetailPage;
