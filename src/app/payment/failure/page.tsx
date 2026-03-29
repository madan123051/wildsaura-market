"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function PaymentFailurePage() {
  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-brand-dark mt-6 font-heading">
          Payment Cancelled
        </h1>
        <p className="text-gray-500 mt-3">
          Your payment was cancelled or failed. No charges were made. Your cart items are still saved.
        </p>
        <div className="mt-8 space-y-3">
          <Link
            href="/checkout"
            className="flex items-center justify-center gap-2 w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
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
      </div>
    </div>
  );
}
