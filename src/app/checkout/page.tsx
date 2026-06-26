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
  runTransaction,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { cn, formatNPR } from "@/lib/utils";
import type { CartItem, PaymentMethod } from "@/types";
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

function getItemType(item: CartItem) {
  return item.type || "photo";
}

function getItemId(item: CartItem) {
  return getItemType(item) === "equipment" ? item.equipmentId || item.photoId : item.photoId;
}

function getSellerName(item: CartItem) {
  return getItemType(item) === "equipment" ? item.sellerName : item.ownerName;
}

async function completeWalletPointsPurchaseInBrowser({
  user,
  orderId,
  orderItems,
  total,
}: {
  user: User;
  orderId: string;
  orderItems: any[];
  total: number;
}) {
  let balanceAfter = 0;
  const pointsUsed = Math.round(total);
  const transactionRef = `POINTS-LOCAL-${Date.now()}`;

  await runTransaction(db, async (tx) => {
    const userRef = doc(db, "users", user.uid);
    const orderRef = doc(db, "orders", orderId);
    const [userSnap, orderSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(orderRef),
    ]);

    if (!orderSnap.exists()) {
      throw new Error("Order not found");
    }

    const order = orderSnap.data();
    if (order.buyerId !== user.uid) {
      throw new Error("Unauthorized order");
    }

    const currentPoints = Number(userSnap.data()?.walletPoints || 0);
    if (currentPoints < pointsUsed) {
      throw new Error(`Insufficient points. You have ${currentPoints}, but need ${pointsUsed}.`);
    }

    const itemRefs = orderItems.map((item) => {
      const itemType = item.itemType || "photo";
      const itemId =
        itemType === "equipment"
          ? item.equipmentId || item.photoId
          : item.photoId;
      return itemId
        ? doc(db, itemType === "equipment" ? "equipmentListings" : "photos", itemId)
        : null;
    });

    const itemSnaps = await Promise.all(
      itemRefs.map((ref) => (ref ? tx.get(ref) : Promise.resolve(null)))
    );

    balanceAfter = currentPoints - pointsUsed;
    const timestamp = serverTimestamp();

    tx.update(userRef, {
      walletPoints: balanceAfter,
      updatedAt: timestamp,
    });

    tx.update(orderRef, {
      status: "paid",
      paymentStatus: "verified",
      trackingStatus: "paid",
      paidAt: timestamp,
      transactionRef,
    });

    tx.set(doc(collection(db, "pointTransactions")), {
      userId: user.uid,
      type: "purchase_spend",
      title: "Purchase with points",
      description: `Used ${pointsUsed} points for order ${orderId}`,
      points: -pointsUsed,
      balanceAfter,
      orderId,
      createdAt: timestamp,
    });

    tx.set(doc(collection(db, "notifications")), {
      userId: user.uid,
      title: "Points used",
      message: `${pointsUsed} points were used for your WildSaura purchase.`,
      points: -pointsUsed,
      orderId,
      read: false,
      createdAt: timestamp,
    });

    orderItems.forEach((item, index) => {
      const itemType = item.itemType || "photo";
      const itemRef = itemRefs[index];
      const itemSnap = itemSnaps[index];

      if (itemType === "equipment") {
        const equipmentId = item.equipmentId || item.photoId;
        if (!equipmentId) return;

        const equipmentData = itemSnap?.exists() ? itemSnap.data() : {};
        const sellerId = item.sellerId || equipmentData.sellerId || "";
        const sellerName = item.sellerName || equipmentData.sellerName || "";

        if (itemRef && itemSnap?.exists()) {
          tx.update(itemRef, {
            status: "sold",
            salesCount: Number(equipmentData.salesCount || 0) + 1,
            updatedAt: timestamp,
          });
        }

        tx.set(doc(collection(db, "equipmentPurchases")), {
          buyerId: user.uid,
          buyerEmail: user.email || "",
          equipmentId,
          equipmentTitle: item.title,
          thumbnailUrl: item.thumbnailUrl,
          sellerId,
          sellerName,
          amountNPR: item.priceNPR,
          orderId,
          paymentMethod: "wallet_points",
          transactionRef,
          status: "completed",
          trackingStatus: "paid",
          purchasedAt: timestamp,
        });

        return;
      }

      const photoId = item.photoId;
      if (!photoId) return;

      const photoData = itemSnap?.exists() ? itemSnap.data() : {};
      const sellerId = photoData.ownerId || item.ownerId || "";
      const sellerName =
        photoData.photographerName ||
        photoData.ownerName ||
        item.ownerName ||
        "";

      tx.set(doc(collection(db, "downloads")), {
        orderId,
        photoId,
        buyerId: user.uid,
        imageUrl: photoData.imageUrl || "",
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
        purchasedAt: timestamp,
      });

      if (itemRef && itemSnap?.exists()) {
        tx.update(itemRef, {
          salesCount: Number(photoData.salesCount || 0) + 1,
        });
      }

      tx.set(doc(collection(db, "purchases")), {
        buyerId: user.uid,
        buyerEmail: user.email || "",
        photoId,
        photoTitle: item.title,
        sellerId,
        sellerName,
        amountNPR: item.priceNPR,
        orderId,
        paymentMethod: "wallet_points",
        transactionRef,
        status: "completed",
        purchasedAt: timestamp,
      });
    });
  });

  return { pointsUsed, balanceAfter };
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
    description: "Pay instantly with WildSaura points (1 point = NPR 1)",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-500",
  },
  {
    id: "cash_on_delivery",
    name: "Cash on Delivery / Meet-up",
    description: "Reserve equipment and pay the seller offline",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-500",
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
  const hasPhotoItems = items.some((item) => getItemType(item) === "photo");
  const hasEquipmentItems = items.some((item) => getItemType(item) === "equipment");

  /* ── pay handler ── */
  const handlePayNow = useCallback(async () => {
    if (!user || items.length === 0) return;
    setProcessing(true);

    try {
      if (selectedPayment === "cash_on_delivery" && hasPhotoItems) {
        toast.error("Cash on Delivery is only available for equipment orders.");
        setProcessing(false);
        return;
      }

      if (selectedPayment === "wallet_points") {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const walletPoints = Number(userSnap.data()?.walletPoints || 0);
        if (walletPoints < total) {
          toast.error(`You need ${total - walletPoints} more points to complete this order.`);
          setProcessing(false);
          return;
        }
      }

      /* 1. Build order items */
      const orderItems = items.map((item) => {
        if (getItemType(item) === "equipment") {
          return {
            itemType: "equipment",
            equipmentId: item.equipmentId || item.photoId,
            title: item.title,
            thumbnailUrl: item.thumbnailUrl,
            priceNPR: item.priceNPR,
            sellerId: item.sellerId || "",
            sellerName: item.sellerName || "",
            trackingStatus: "order_placed",
          };
        }

        return {
          itemType: "photo",
          photoId: item.photoId,
          title: item.title,
          thumbnailUrl: item.thumbnailUrl,
          priceNPR: item.priceNPR,
          ownerId: item.ownerId || "",
          ownerName: item.ownerName || "",
        };
      });

      /* 2. Create order (pending) */
      const orderRef = await addDoc(collection(db, "orders"), {
        buyerId: user.uid,
        buyerEmail: user.email || "",
        items: orderItems,
        totalNPR: total,
        status: "pending",
        paymentMethod: selectedPayment,
        itemTypes: Array.from(new Set(orderItems.map((item: any) => item.itemType))),
        paymentStatus: selectedPayment === "cash_on_delivery" ? "cod_pending" : "pending",
        trackingStatus: selectedPayment === "cash_on_delivery" ? "order_placed" : "awaiting_payment",
        createdAt: serverTimestamp(),
      });

      if (selectedPayment === "cash_on_delivery") {
        await Promise.all(
          orderItems
            .filter((item: any) => item.itemType === "equipment")
            .map(async (item: any) => {
              if (!item.equipmentId) return;
              await updateDoc(doc(db, "equipmentListings", item.equipmentId), {
                status: "sold",
                salesCount: increment(1),
                updatedAt: serverTimestamp(),
              });
            })
        );
        clearCart();
        toast.success("Equipment order placed. Track it from your dashboard.");
        router.push(`/dashboard?tab=purchases&order=${orderRef.id}`);
        return;
      }

      /* 3. Initiate eSewa payment */
      if (selectedPayment === "esewa") {
        toast.loading("Redirecting to eSewa...", { id: "esewa-redirect" });

        const idToken = await user.getIdToken();
        const esewaRes = await fetch("/api/esewa", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: orderRef.id }),
        });

        const esewaData = await esewaRes.json();

        if (!esewaData.success || !esewaData.data?.formFields) {
          toast.dismiss("esewa-redirect");
          throw new Error(esewaData.error || "Failed to initiate eSewa payment");
        }

        // Create hidden form and redirect to eSewa
        const form = document.createElement("form");
        form.method = "POST";
        form.action = esewaData.data.paymentUrl;
        form.style.display = "none";

        const fields = esewaData.data.formFields;
        for (const [key, value] of Object.entries(fields)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
        return; // Page will redirect to eSewa
      }

      if (selectedPayment === "wallet_points") {
        toast.loading("Using WildSaura points...", { id: "wallet-points" });

        let walletData: { pointsUsed: number; balanceAfter: number };
        try {
          const idToken = await user.getIdToken();
          const walletRes = await fetch("/api/wallet-points", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId: orderRef.id }),
          });

          const apiData = await walletRes.json();

          if (!apiData.success) {
            const apiError = new Error(apiData.error || "Failed to complete points payment");
            (apiError as Error & { status?: number }).status = walletRes.status;
            throw apiError;
          }

          walletData = apiData.data;
        } catch (walletError) {
          const status = (walletError as Error & { status?: number }).status;
          if (status && status < 500) {
            toast.dismiss("wallet-points");
            throw walletError;
          }

          console.warn("Wallet points API unavailable; using client-side fallback.", walletError);
          walletData = await completeWalletPointsPurchaseInBrowser({
            user,
            orderId: orderRef.id,
            orderItems,
            total,
          });
        }

        toast.dismiss("wallet-points");
        clearCart();
        toast.success(`${walletData.pointsUsed || total} points used. Purchase complete!`);
        router.push(
          hasEquipmentItems
            ? `/dashboard?tab=purchases&order=${orderRef.id}`
            : `/dashboard?tab=downloads&order=${orderRef.id}`
        );
        return;
      }

      // For other payment methods (khalti) — show coming soon
      toast.error(`${PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.name || "This payment method"} is coming soon! Please use eSewa.`);
      // Delete the pending order
      await updateDoc(doc(db, "orders", orderRef.id), { status: "cancelled" });
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }, [user, items, total, selectedPayment, router, hasPhotoItems, hasEquipmentItems]);

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
            Your cart is empty. Add photos or equipment first!
          </p>
          <Link
            href="/shopping"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition hover:bg-brand-primary/90"
          >
            Browse Equipment
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
                  method.id === "cash_on_delivery" && !hasEquipmentItems ? null : (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    disabled={method.id === "cash_on_delivery" && hasPhotoItems}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
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
                      {method.id === "cash_on_delivery" && (
                        <ShoppingCart
                          className={cn(
                            "h-5 w-5",
                            selectedPayment === method.id
                              ? "text-blue-600"
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
                        {method.id === "cash_on_delivery" && hasPhotoItems
                          ? "Available only when your cart has equipment only"
                          : method.description}
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
                            method.id === "wallet_points" && "bg-amber-500",
                            method.id === "cash_on_delivery" && "bg-blue-500"
                          )}
                        />
                      )}
                    </div>
                  </button>
                  )
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
                    key={`${getItemType(item)}:${getItemId(item)}`}
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
                      <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {getItemType(item) === "equipment" ? "Equipment" : "Photo"}
                      </span>
                      {getSellerName(item) && (
                        <p className="text-xs text-gray-500">
                          by {getSellerName(item)}
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
                    {selectedPayment === "cash_on_delivery"
                      ? "Place Equipment Order"
                      : selectedPayment === "wallet_points"
                        ? `Pay ${total} Points`
                        : `Pay ${formatNPR(total)}`}
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
