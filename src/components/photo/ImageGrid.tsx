"use client";

import { PhotoCard } from "./PhotoCard";
import type { StockPhoto, CartItem } from "@/types";

interface ImageGridProps {
  photos: StockPhoto[];
  onAddToCart?: (item: CartItem) => void;
}

export function ImageGrid({ photos, onAddToCart }: ImageGridProps) {
  if (!photos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-4xl mb-3">📷</p>
        <p className="text-lg font-medium">No photos found</p>
        <p className="text-sm">Try a different category or search term.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onAddToCart={
            onAddToCart
              ? (p) => onAddToCart({ photoId: p.id, title: p.title, thumbnailUrl: p.thumbnailUrl, priceNPR: p.priceNPR })
              : undefined
          }
        />
      ))}
    </div>
  );
}
