"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ChevronRight, ExternalLink, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { openDrishya } from "@/lib/drishya";

export type SellOnDrishyaVariant = "hero" | "secondary" | "navbar" | "dashboard";

interface SellOnDrishyaButtonProps {
  variant?: SellOnDrishyaVariant;
  className?: string;
  onBeforeOpen?: () => void;
  showDescription?: boolean;
  hideIcon?: boolean;
}

const variantStyles: Record<SellOnDrishyaVariant, string> = {
  hero: "bg-brand-secondary hover:bg-amber-500 text-brand-dark font-bold px-8 py-4 rounded-xl text-base shadow-lg",
  secondary: "bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-base border border-white/20",
  navbar: "px-4 py-2 text-sm font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg",
  dashboard: "p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 text-left",
};

function VariantIcon({ variant }: { variant: SellOnDrishyaVariant }) {
  if (variant === "dashboard") return <Upload className="w-8 h-8 text-orange-600" aria-hidden="true" />;
  return <Camera className={variant === "navbar" ? "w-3.5 h-3.5" : "h-5 w-5"} aria-hidden="true" />;
}

function Modal({ onCancel, onContinue }: { onCancel: () => void; onContinue: () => void }) {
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    continueRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drishya-redirect-title"
        aria-describedby="drishya-redirect-description"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <Camera className="h-6 w-6" aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel Drishya redirect"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <h2 id="drishya-redirect-title" className="mt-5 text-xl font-bold text-brand-dark">
          Continue to Drishya?
        </h2>
        <p id="drishya-redirect-description" className="mt-3 text-sm leading-6 text-gray-600">
          You are being redirected to Drishya to upload and manage your photos.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          >
            Cancel
          </button>
          <button
            ref={continueRef}
            type="button"
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          >
            Continue to Drishya
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function SellOnDrishyaButton({
  variant = "secondary",
  className,
  onBeforeOpen,
  showDescription = variant === "dashboard",
  hideIcon = false,
}: SellOnDrishyaButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleContinue = () => {
    setShowModal(false);
    onBeforeOpen?.();
    openDrishya();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        aria-label="Sell Photos on Drishya"
        className={cn(
          "inline-flex items-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:ring-offset-2",
          variant === "dashboard" ? "w-full" : "justify-center",
          variantStyles[variant],
          className
        )}
      >
        {variant === "dashboard" && !showDescription ? (
          <>
            {!hideIcon && <Camera className="h-4 w-4" aria-hidden="true" />}
            Sell Photos
          </>
        ) : variant === "dashboard" ? (
          <>
            {!hideIcon && <VariantIcon variant={variant} />}
            <div>
              <h4 className="font-medium text-gray-900">Sell Photos</h4>
              <p className="text-sm text-gray-500">Upload and manage photos on Drishya</p>
            </div>
            <ChevronRight className="ml-auto h-5 w-5 text-gray-400" aria-hidden="true" />
          </>
        ) : (
          <>
            {!hideIcon && <VariantIcon variant={variant} />}
            Sell Photos
            {variant !== "navbar" && <ExternalLink className="h-4 w-4" aria-hidden="true" />}
          </>
        )}
      </button>
      {showModal && <Modal onCancel={() => setShowModal(false)} onContinue={handleContinue} />}
    </>
  );
}
