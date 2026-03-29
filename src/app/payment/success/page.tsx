"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle, Download, ArrowLeft } from "lucide-react";

const CART_KEY = "wildsaura_cart";

function clearCart() {
  if (typeof window !== "undefined") {
    localStorage.setItem(CART_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("cart-updated"));
  }
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  const tid = searchParams.get("tid");
  const oid = searchParams.get("oid");

  useEffect(() => {
    if (!tid || !oid) {
      setStatus("failed");
      setErrorMsg("Missing payment information.");
      return;
    }

    async function verifyPayment() {
      try {
        const res = await fetch(`/api/esewa?tid=${tid}&oid=${oid}`);
        const data = await res.json();

        if (data.success) {
          setStatus("success");
          clearCart();
        } else {
          setStatus("failed");
          setErrorMsg(data.error || "Payment verification failed.");
        }
      } catch {
        setStatus("failed");
        setErrorMsg("Could not verify payment. Please contact support.");
      }
    }

    verifyPayment();
  }, [tid, oid]);

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {status === "verifying" && (
          <>
            <Loader2 className="h-16 w-16 text-brand-primary mx-auto animate-spin" />
            <h1 className="text-2xl font-bold text-brand-dark mt-6 font-heading">
              Verifying Payment...
            </h1>
            <p className="text-gray-500 mt-3">
              Please wait while we confirm your payment with eSewa.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-brand-dark mt-6 font-heading">
              Payment Successful! 🎉
            </h1>
            <p className="text-gray-500 mt-3">
              Your photos are ready to download. Each download includes a licensed ZIP with watermark protection.
            </p>
            <div className="mt-8 space-y-3">
              <Link
                href="/downloads"
                className="flex items-center justify-center gap-2 w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                <Download className="h-5 w-5" />
                Go to Downloads
              </Link>
              <Link
                href="/explore"
                className="flex items-center justify-center gap-2 w-full border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Link>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-brand-dark mt-6 font-heading">
              Payment Failed
            </h1>
            <p className="text-gray-500 mt-3">
              {errorMsg || "Something went wrong with your payment."}
            </p>
            <div className="mt-8 space-y-3">
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Try Again
              </Link>
              <Link
                href="/explore"
                className="flex items-center justify-center gap-2 w-full border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Explore
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
