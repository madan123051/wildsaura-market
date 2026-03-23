"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { cn, formatPriceNPR, qualityLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { StockPhoto } from "@/types";

interface PhotoCardProps {
  photo: StockPhoto;
  onAddToCart?: (photo: StockPhoto) => void;
  className?: string;
}

export function PhotoCard({ photo, onAddToCart, className }: PhotoCardProps) {
  const quality = qualityLabel(photo.aiQualityScore);

  return (
    <div className={cn("group relative rounded-xl2 overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300", className)}>
      {/* Image */}
      <Link href={`/photo/${photo.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={photo.thumbnailUrl}
            alt={photo.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* AI Score badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="info" className="backdrop-blur-sm bg-white/80 text-brand-dark gap-1">
              <Star size={10} className="fill-brand-secondary text-brand-secondary" />
              {photo.aiQualityScore.toFixed(1)}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link href={`/photo/${photo.id}`}>
          <h3 className="font-semibold text-brand-dark text-sm line-clamp-1 hover:text-brand-primary transition-colors">
            {photo.title}
          </h3>
        </Link>
        <div className="mt-1 flex flex-wrap gap-1">
          {photo.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-gray-500 bg-surface-muted rounded-full px-2 py-0.5">
              #{tag}
            </span>
          ))}
        </div>

        {/* Price & Cart */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-brand-primary font-bold text-base">{formatPriceNPR(photo.priceNPR)}</p>
            <p className={cn("text-xs", quality.color)}>{quality.label}</p>
          </div>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(photo)}
              className="flex items-center gap-1.5 rounded-xl bg-brand-primary px-3 py-2 text-xs font-medium text-white hover:bg-brand-primary/90 transition-colors"
            >
              <ShoppingCart size={14} />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
