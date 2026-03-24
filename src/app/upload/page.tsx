"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DRISHYA_APP_URL } from "@/types";
import { Camera, ExternalLink, ArrowLeft, Upload, CheckCircle, Shield, Sparkles } from "lucide-react";

export default function UploadPage() {
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);

  const drishyaUploadUrl = `${DRISHYA_APP_URL}/upload`;

  useEffect(() => {
    if (!autoRedirect) return;
    if (countdown <= 0) {
      window.location.href = drishyaUploadUrl;
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, autoRedirect, drishyaUploadUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 via-gray-950 to-gray-950 flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <Camera className="w-10 h-10 text-green-400" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Upload via{" "}
          <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Drishya
          </span>
        </h1>

        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
          WildSaura Market is your marketplace for selling photos. To upload and
          publish new photos, use our companion app{" "}
          <span className="text-green-400 font-medium">Drishya</span>.
        </p>

        {/* Steps */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8 text-left">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
            How it works
          </h3>
          <div className="space-y-4">
            {[
              {
                icon: Upload,
                title: "Upload on Drishya",
                desc: "Select your best photos and upload them on Drishya app",
              },
              {
                icon: Sparkles,
                title: "AI Auto-Categorizes",
                desc: "Our AI analyzes your photo — detects category, tags, quality score automatically",
              },
              {
                icon: Shield,
                title: "Review & Publish",
                desc: "Set your price, review AI suggestions, and publish to marketplace",
              },
              {
                icon: CheckCircle,
                title: "Sell on WildSaura",
                desc: "Your photos appear here in the correct category — ready to sell!",
              },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <step.icon className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{step.title}</p>
                  <p className="text-gray-500 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <a
            href={drishyaUploadUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Go to Drishya
            <ExternalLink className="w-4 h-4" />
          </a>
          <Link
            href="/explore"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium px-8 py-3 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Explore Photos
          </Link>
        </div>

        {/* Auto Redirect */}
        {autoRedirect && (
          <p className="text-gray-600 text-sm">
            Redirecting to Drishya in{" "}
            <span className="text-green-400 font-mono">{countdown}s</span>
            <span className="mx-2">·</span>
            <button
              onClick={() => setAutoRedirect(false)}
              className="text-gray-500 hover:text-white underline transition-colors"
            >
              Cancel
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
