"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  Trash2,
  X,
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  Package,
  ShieldCheck,
} from "lucide-react";
import { cn, formatNPR } from "@/lib/utils";
import type { CartItem } from "@/types";
import toast, { Toaster } from "react-hot-toast";

/* ───────────────────────── helpers ───────────────────────── */

const CART_KEY = "wildsaura_cart";
const SERVICE_FEE_RATE = 0.05;

function getCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

/* ═══════════════════════════ MAIN ═══════════════════════════ */

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  /* ── init ── */
  useEffect(() => {
    setItems(getCartItems());
    setMounted(true);
  }, []);

  /* ── sync ── */
  useEffect(() => {
    const handler = () => setItems(getCartItems());
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  /* ── remove item ── */
  const removeItem = useCallback(
    (photoId: string) => {
      const updated = items.filter((i) => i.photoId !== photoId);
      saveCart(updated);
      setItems(updated);
      toast.success("Removed from cart");
    },
    [items]
  );

  /* ── clear cart ── */
  const clearCart = useCallback(() => {
    saveCart([]);
    setItems([]);
    toast.success("Cart cleared");
  }, []);

  /* ── totals ── */
  const subtotal = items.reduce((sum, i) => sum + i.priceNPR, 0);
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + serviceFee;

  /* ── loading guard ── */
  if (!mounted) {
    return (
      <div className="min-h-screen bg-brand-light">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 h-10 w-48 animate-pulse rounded-lg bg-gray-200" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-24 animate-pulse rounded-xl bg-gray-200"
                />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  /* ── empty cart ── */
  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-light px-4">
        <Toaster position="top-right" />
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gray-100">
            <ShoppingCart className="h-14 w-14 text-gray-300" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-brand-dark">
            Your Cart is Empty
          </h1>
          <p className="mt-3 max-w-md text-gray-500">
            Discover stunning Nepal photography — nature, wildlife, landscapes,
            and more — from talented local photographers.
          </p>
          <Link
            href="/explore"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition hover:bg-brand-primary/90"
          >
            <ImageIcon className="h-4 w-4" />
            Browse Photos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-brand-dark">
              Shopping Cart
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 transition hover:border-brand-accent hover:text-brand-accent"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Cart
          </button>
        </div>

        {/* ═══════════ two-column ═══════════ */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ── items list ── */}
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <div
                key={item.photoId}
                className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover"
              >
                {/* thumbnail */}
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-muted sm:h-24 sm:w-28">
                  {item.thumbnailUrl ? (
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="112px"
                      quality={30}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100">
                      <ImageIcon className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/photo/${item.photoId}`}
                    className="block truncate font-medium text-brand-dark transition hover:text-brand-primary"
                  >
                    {item.title}
                  </Link>
                  {item.ownerName && (
                    <p className="mt-0.5 truncate text-sm text-gray-500">
                      by {item.ownerName}
                    </p>
                  )}
                  <p className="mt-1 text-lg font-bold text-brand-primary sm:hidden">
                    {formatNPR(item.priceNPR)}
                  </p>
                </div>

                {/* price (desktop) */}
                <p className="hidden text-lg font-bold text-brand-primary sm:block">
                  {formatNPR(item.priceNPR)}
                </p>

                {/* remove */}
                <button
                  onClick={() => removeItem(item.photoId)}
                  className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-brand-accent"
                  aria-label="Remove item"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          {/* ── order summary ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
              <h2 className="mb-4 font-heading text-lg font-bold text-brand-dark">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-600">
                  <span>
                    Subtotal ({items.length}{" "}
                    {items.length === 1 ? "item" : "items"})
                  </span>
                  <span className="font-medium">{formatNPR(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Service Fee (5%)</span>
                  <span className="font-medium">{formatNPR(serviceFee)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-brand-dark">
                      Total
                    </span>
                    <span className="font-heading text-2xl font-bold text-brand-primary">
                      {formatNPR(total)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition hover:bg-brand-primary/90 active:scale-[0.98]"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </button>

              <Link
                href="/explore"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 transition hover:border-brand-primary hover:text-brand-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Link>

              {/* trust signals */}
              <div className="mt-6 space-y-2 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-brand-primary" />
                  <span>Secure payment processing</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Package className="h-4 w-4 text-brand-primary" />
                  <span>Instant digital download</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
