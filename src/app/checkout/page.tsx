"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  Wallet,
  Loader2,
  ShieldCheck,
  Lock,
  ArrowLeft,
  CheckCircle2,
  LogIn,
  ShoppingCart,
} from "lucide-react";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { cn, formatNPR } from "@/lib/utils";
import type { CartItem, PaymentMethod, OrderItem } from "@/types";
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

function clearCart() {
  localStorage.setItem(CART_KEY, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

/* ── payment methods ── */
const PAYMENT_METHODS: {
  id: PaymentMethod;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    id: "esewa",
    name: "eSewa",
    description: "Pay with eSewa digital wallet",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-500",
  },
  {
    id: "khalti",
    name: "Khalti",
    description: "Pay with Khalti digital wallet",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-500",
  },
  {
    id: "wallet_points",
    name: "Wallet Points",
    description: "Pay using your WildSaura points",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-500",
  },
];

/* ═══════════════════════════ MAIN ═══════════════════════════ */

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("esewa");
  const [processing, setProcessing] = useState(false);

  /* ── auth listener ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  /* ── load cart ── */
  useEffect(() => {
    setItems(getCartItems());
    setMounted(true);
  }, []);

  /* ── totals ── */
  const subtotal = items.reduce((sum, i) => sum + i.priceNPR, 0);
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + serviceFee;

  /* ── pay handler ── */
  const handlePayNow = useCallback(async () => {
    if (!user || items.length === 0) return;
    setProcessing(true);

    try {
      /* 1. Build order items */
      const orderItems: OrderItem[] = items.map((item) => ({
        photoId: item.photoId,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
        priceNPR: item.priceNPR,
        ownerId: "", // will be populated server-side in production
      }));

      /* 2. Create order (pending) */
      const orderRef = await addDoc(collection(db, "orders"), {
        buyerId: user.uid,
        buyerEmail: user.email || "",
        items: orderItems,
        totalNPR: total,
        status: "pending",
        paymentMethod: selectedPayment,
        createdAt: serverTimestamp(),
      });

      /* 3. Mock payment delay */
      await new Promise((resolve) => setTimeout(resolve, 2000));

      /* 4. Update order → paid */
      await updateDoc(doc(db, "orders", orderRef.id), {
        status: "paid",
      });

      /* 5. Create download records (with actual imageUrl) + update salesCount */
      const downloadPromises = items.map(async (item) => {
        // Fetch the actual high-res imageUrl from the photo document
        let imageUrl = "";
        try {
          const photoSnap = await getDoc(doc(db, "photos", item.photoId));
          if (photoSnap.exists()) {
            imageUrl = photoSnap.data()?.imageUrl || "";
          }
        } catch {
          // Will be resolved via secure download API as fallback
        }
        return addDoc(collection(db, "downloads"), {
          orderId: orderRef.id,
          photoId: item.photoId,
          buyerId: user.uid,
          imageUrl,
          title: item.title,
          thumbnailUrl: item.thumbnailUrl,
          purchasedAt: serverTimestamp(),
        });
      });

      const salesPromises = items.map((item) =>
        updateDoc(doc(db, "photos", item.photoId), {
          salesCount: increment(1),
        }).catch(() => {})
      );

      // Create purchase records for admin dashboard tracking
      const purchasePromises = items.map((item) =>
        addDoc(collection(db, "purchases"), {
          buyerId: user.uid,
          buyerEmail: user.email || "",
          photoId: item.photoId,
          photoTitle: item.title,
          sellerId: "", // populated from photo data
          sellerName: item.ownerName || "",
          amountNPR: item.priceNPR,
          orderId: orderRef.id,
          paymentMethod: selectedPayment,
          status: "completed",
          purchasedAt: serverTimestamp(),
        })
      );

      await Promise.all([...downloadPromises, ...salesPromises, ...purchasePromises]);

      /* 6. Clear cart & redirect */
      clearCart();
      toast.success("Payment successful! 🎉");
      router.push("/downloads");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }, [user, items, total, selectedPayment, router]);

  /* ── loading ── */
  if (authLoading || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-light">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  /* ── not logged in ── */
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-light px-4">
        <Toaster position="top-right" />
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/10">
            <Lock className="h-10 w-10 text-brand-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-brand-dark">
            Login Required
          </h1>
          <p className="mt-2 text-gray-500">
            Please log in to complete your purchase.
          </p>
          <Link
            href="/login?redirect=/checkout"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition hover:bg-brand-primary/90"
          >
            <LogIn className="h-4 w-4" />
            Log In to Continue
          </Link>
          <Link
            href="/cart"
            className="mt-3 block text-sm text-gray-500 transition hover:text-brand-primary"
          >
            ← Back to Cart
          </Link>
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
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <ShoppingCart className="h-12 w-12 text-gray-300" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-brand-dark">
            No Items to Checkout
          </h1>
          <p className="mt-2 text-gray-500">
            Your cart is empty. Add some photos first!
          </p>
          <Link
            href="/explore"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition hover:bg-brand-primary/90"
          >
            Browse Photos
          </Link>
        </div>
      </div>
    );
  }

  /* ── processing overlay ── */
  if (processing) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-light/95 backdrop-blur-sm">
        <Toaster position="top-right" />
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-primary/10">
            <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-brand-dark">
            Processing Payment...
          </h2>
          <p className="mt-2 text-gray-500">
            Please wait while we process your{" "}
            {PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.name}{" "}
            payment.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
            <Lock className="h-3.5 w-3.5" />
            <span>Secure transaction in progress</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* header */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-brand-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
          <h1 className="font-heading text-3xl font-bold text-brand-dark">
            Checkout
          </h1>
        </div>

        {/* ═══════════ two-column ═══════════ */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* ── left: payment + items ── */}
          <div className="space-y-6 lg:col-span-3">
            {/* payment methods */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
              <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-brand-dark">
                <CreditCard className="h-5 w-5 text-brand-primary" />
                Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition",
                      selectedPayment === method.id
                        ? cn(method.borderColor, method.bgColor)
                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        selectedPayment === method.id
                          ? method.bgColor
                          : "bg-gray-100"
                      )}
                    >
                      {method.id === "esewa" && (
                        <CreditCard
                          className={cn(
                            "h-5 w-5",
                            selectedPayment === method.id
                              ? "text-green-600"
                              : "text-gray-400"
                          )}
                        />
                      )}
                      {method.id === "khalti" && (
                        <CreditCard
                          className={cn(
                            "h-5 w-5",
                            selectedPayment === method.id
                              ? "text-purple-600"
                              : "text-gray-400"
                          )}
                        />
                      )}
                      {method.id === "wallet_points" && (
                        <Wallet
                          className={cn(
                            "h-5 w-5",
                            selectedPayment === method.id
                              ? "text-amber-600"
                              : "text-gray-400"
                          )}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          "font-semibold",
                          selectedPayment === method.id
                            ? method.color
                            : "text-brand-dark"
                        )}
                      >
                        {method.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {method.description}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition",
                        selectedPayment === method.id
                          ? cn(method.borderColor)
                          : "border-gray-300"
                      )}
                    >
                      {selectedPayment === method.id && (
                        <div
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            method.id === "esewa" && "bg-green-500",
                            method.id === "khalti" && "bg-purple-500",
                            method.id === "wallet_points" && "bg-amber-500"
                          )}
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* items list */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
              <h2 className="mb-4 font-heading text-lg font-bold text-brand-dark">
                Order Items
              </h2>
              <div className="divide-y divide-gray-50">
                {items.map((item) => (
                  <div
                    key={item.photoId}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                        quality={30}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-brand-dark">
                        {item.title}
                      </p>
                      {item.ownerName && (
                        <p className="text-xs text-gray-500">
                          by {item.ownerName}
                        </p>
                      )}
                    </div>
                    <p className="flex-shrink-0 text-sm font-bold text-brand-primary">
                      {formatNPR(item.priceNPR)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── right: summary ── */}
          <div className="lg:col-span-2">
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
                onClick={handlePayNow}
                disabled={processing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition hover:bg-brand-primary/90 active:scale-[0.98] disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay {formatNPR(total)}
                  </>
                )}
              </button>

              {/* trust */}
              <div className="mt-5 space-y-2 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-brand-primary" />
                  <span>Secure & encrypted payment</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 className="h-4 w-4 text-brand-primary" />
                  <span>Instant access to downloads</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
