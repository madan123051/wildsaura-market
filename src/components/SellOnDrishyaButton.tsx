"use client";

import { useRouter } from "next/navigation";
import { Camera, ChevronRight, ShieldCheck, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { redirectToDrishyaVerify, MARKET_URL } from "@/lib/drishya";
import { useAuth } from "@/hooks/useAuth";

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
  if (variant === "dashboard")
    return <Upload className="w-8 h-8 text-orange-600" aria-hidden="true" />;
  return (
    <Camera
      className={variant === "navbar" ? "w-3.5 h-3.5" : "h-5 w-5"}
      aria-hidden="true"
    />
  );
}

export function SellOnDrishyaButton({
  variant = "secondary",
  className,
  onBeforeOpen,
  showDescription = variant === "dashboard",
  hideIcon = false,
}: SellOnDrishyaButtonProps) {
  const router = useRouter();
  const { user, profile } = useAuth();

  const handleClick = () => {
    onBeforeOpen?.();

    // Not logged in → send to login with a redirect back to /upload
    if (!user) {
      router.push("/login?redirect=/upload");
      return;
    }

    // Verified → go straight to the Market upload page
    if (profile?.isVerified) {
      router.push("/upload");
      return;
    }

    // Not verified → redirect to Drishya verification
    redirectToDrishyaVerify(`${MARKET_URL}/upload`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Sell Photos"
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
            <p className="text-sm text-gray-500">
              {profile?.isVerified
                ? "Upload and manage your photos"
                : "Verification required to sell"}
            </p>
          </div>
          {profile?.isVerified ? (
            <ChevronRight
              className="ml-auto h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          ) : (
            <ShieldCheck
              className="ml-auto h-5 w-5 text-amber-400"
              aria-hidden="true"
            />
          )}
        </>
      ) : (
        <>
          {!hideIcon && <VariantIcon variant={variant} />}
          Sell Photos
          {variant !== "navbar" && !profile?.isVerified && (
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          )}
        </>
      )}
    </button>
  );
}
