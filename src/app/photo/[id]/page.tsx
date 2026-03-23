"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPriceNPR, qualityLabel, formatDate, capitalize } from "@/lib/utils";
import { ShoppingCart, Download, Star, Tag, Calendar, User } from "lucide-react";
import type { StockPhoto } from "@/types";

export default function PhotoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user }  = useAuth();
  const { addToCart, count } = useCart();
  const [photo,   setPhoto]   = useState<StockPhoto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const ref  = doc(db, "photos", id);
      const snap = await getDoc(ref);
      if (snap.exists()) setPhoto({ id: snap.id, ...snap.data() } as StockPhoto);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!photo) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-4xl">🔍</p>
      <p className="text-lg font-medium">Photo not found</p>
      <Link href="/explore"><Button>Back to Explore</Button></Link>
    </div>
  );

  const quality = qualityLabel(photo.aiQualityScore);

  const handleBuyNow = () => {
    if (!user) { router.push("/(auth)/login"); return; }
    addToCart({ photoId: photo.id, title: photo.title, thumbnailUrl: photo.thumbnailUrl, priceNPR: photo.priceNPR });
    // TODO: redirect to checkout with eSewa
    router.push("/checkout");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar cartCount={count} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-card-hover bg-surface-muted">
            <Image src={photo.imageUrl} alt={photo.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="info">{capitalize(photo.category)}</Badge>
                <Badge variant={photo.status === "approved" ? "success" : "warning"}>{photo.status}</Badge>
              </div>
              <h1 className="font-heading text-3xl font-bold text-brand-dark">{photo.title}</h1>
              {photo.description && <p className="text-gray-600 mt-2 leading-relaxed">{photo.description}</p>}
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Star size={16} className="text-brand-secondary" />
                <span>AI Score: <strong className={quality.color}>{photo.aiQualityScore}/10 ({quality.label})</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Download size={16} className="text-brand-primary" />
                <span>Sales: <strong>{photo.salesCount}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} />
                <span>Uploaded: {formatDate(photo.createdAt)}</span>
              </div>
              {photo.resolution && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-xs">📐 {photo.resolution}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                <Tag size={14} /> Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {photo.tags.map((tag) => (
                  <Link key={tag} href={`/explore?q=${tag}`}>
                    <span className="text-xs bg-brand-primary/10 text-brand-primary rounded-full px-3 py-1 hover:bg-brand-primary/20 transition-colors">
                      #{tag}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Price & CTA */}
            <div className="border border-surface-border rounded-2xl p-5 bg-surface-muted">
              <p className="text-sm text-gray-500 mb-1">License Price</p>
              <p className="text-4xl font-bold font-heading text-brand-primary mb-4">{formatPriceNPR(photo.priceNPR)}</p>
              <div className="flex gap-3">
                <Button className="flex-1" size="lg" onClick={handleBuyNow} leftIcon={<ShoppingCart size={18} />}>
                  Buy Now via eSewa
                </Button>
                <Button variant="outline" size="lg"
                  onClick={() => addToCart({ photoId: photo.id, title: photo.title, thumbnailUrl: photo.thumbnailUrl, priceNPR: photo.priceNPR })}>
                  <ShoppingCart size={18} />
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Secure payment via eSewa · Instant download after purchase
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
