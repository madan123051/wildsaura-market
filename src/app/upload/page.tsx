"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, ExternalLink, Upload, ArrowRight, Clock } from "lucide-react";
import { DRISHYA_APP_URL } from "@/types";

export default function UploadRedirectPage() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = DRISHYA_APP_URL;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Camera className="w-10 h-10 text-emerald-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Upload Photos on Drishya
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          WildSaura Market is a buy-only marketplace. To sell your photos,
          upload them on our partner platform <strong>Drishya</strong>.
        </p>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-2 text-emerald-600 mb-8">
          <Clock className="w-5 h-5" />
          <span className="text-sm">
            Redirecting to Drishya in{" "}
            <strong>{countdown} seconds</strong>...
          </span>
        </div>

        {/* CTA Button */}
        <a
          href={DRISHYA_APP_URL}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 mb-12"
        >
          Go to Drishya Now
          <ExternalLink className="w-5 h-5" />
        </a>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">1. Upload on Drishya</h3>
              <p className="text-sm text-gray-500">
                Upload your photos and get AI-powered tagging
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                2. Auto-sync to Market
              </h3>
              <p className="text-sm text-gray-500">
                Your approved photos appear here automatically
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Camera className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">3. Earn Money</h3>
              <p className="text-sm text-gray-500">
                Buyers purchase your photos on WildSaura Market
              </p>
            </div>
          </div>
        </div>

        {/* Back link */}
        <Link
          href="/explore"
          className="inline-block mt-8 text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back to Explore
        </Link>
      </div>
    </div>
  );
}
