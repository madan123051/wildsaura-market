"use client";

import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface ProtectedImageProps extends Omit<ImageProps, "onContextMenu" | "draggable"> {
  watermark?: boolean;
  watermarkText?: string;
  watermarkSize?: "sm" | "md" | "lg";
  containerClassName?: string;
}

/**
 * ProtectedImage — prevents right-click save, drag-save,
 * and renders a repeating watermark overlay so raw thumbnails
 * are not commercially usable.
 */
export function ProtectedImage({
  watermark = false,
  watermarkText = "WildSaura",
  watermarkSize = "md",
  containerClassName,
  className,
  alt,
  ...props
}: ProtectedImageProps) {
  const sizeClasses = {
    sm: "text-xl sm:text-2xl",
    md: "text-2xl sm:text-3xl lg:text-4xl",
    lg: "text-3xl sm:text-4xl lg:text-5xl",
  };

  return (
    <div
      className={cn("relative select-none", containerClassName)}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ WebkitUserSelect: "none", userSelect: "none" }}
    >
      <Image
        {...props}
        alt={alt}
        className={className}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
      {/* Transparent overlay blocks direct image interaction */}
      <div
        className="absolute inset-0 z-10"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
      {/* Repeating watermark */}
      {watermark && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
          <div className="flex flex-col gap-14 -rotate-[30deg] opacity-[0.18]">
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "whitespace-nowrap font-heading font-bold tracking-[0.2em] text-white drop-shadow-lg",
                  sizeClasses[watermarkSize]
                )}
              >
                {watermarkText} &nbsp;&nbsp; {watermarkText} &nbsp;&nbsp; {watermarkText}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
