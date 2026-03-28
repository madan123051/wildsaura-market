"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  ShieldX,
  Search,
  Loader2,
  Camera,
  User,
  Calendar,
  Tag,
  CreditCard,
  FileText,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ImageIcon,
} from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface LicenseData {
  licenseCode: string;
  photoId: string;
  photoTitle: string;
  thumbnailUrl: string;
  buyerEmail: string;
  photographerName: string;
  category: string;
  priceNPR: number;
  purchaseDate: any;
  downloadDate: any;
  isValid: boolean;
  licenseType: string;
  hasWatermark: boolean;
}

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") || "";

  const [code, setCode] = useState(codeFromUrl);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LicenseData | null>(null);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Auto-verify if code in URL
  useEffect(() => {
    if (codeFromUrl) {
      handleVerify(codeFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeFromUrl]);

  const handleVerify = async (verifyCode?: string) => {
    const codeToCheck = (verifyCode || code).trim().toUpperCase();
    if (!codeToCheck) return;

    setLoading(true);
    setSearched(true);
    setNotFound(false);
    setResult(null);

    try {
      const q = query(
        collection(db, "licenses"),
        where("licenseCode", "==", codeToCheck)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setNotFound(true);
      } else {
        const data = snap.docs[0].data() as LicenseData;
        setResult(data);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: any) => {
    if (!d) return "N/A";
    const date = d.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-light to-white">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Back */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-brand-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Market
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10">
            <ShieldCheck className="h-8 w-8 text-brand-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-brand-dark">
            License Verification
          </h1>
          <p className="mt-2 text-gray-500">
            Enter a WildSaura license code to verify its authenticity
          </p>
        </div>

        {/* Search Box */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <FileText className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Enter license code (e.g., WS-XXXXXXXX-XXXX)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 font-mono text-sm tracking-wider text-brand-dark placeholder:text-gray-400 focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <button
              onClick={() => handleVerify()}
              disabled={loading || !code.trim()}
              className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Verify
            </button>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            <p className="mt-3 text-sm text-gray-500">
              Verifying license code...
            </p>
          </div>
        )}

        {/* ── VALID LICENSE ── */}
        {!loading && result && (
          <div className="overflow-hidden rounded-2xl border-2 border-green-200 bg-white shadow-card">
            {/* Status Banner */}
            <div className="flex items-center gap-3 bg-green-50 px-6 py-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">
                  ✅ Valid License
                </p>
                <p className="text-sm text-green-600">
                  This is an authentic WildSaura Market license
                </p>
              </div>
            </div>

            <div className="p-6">
              {/* Photo Preview */}
              {result.thumbnailUrl && (
                <div className="mb-6 overflow-hidden rounded-xl">
                  <div className="relative aspect-video bg-gray-100">
                    <Image
                      src={result.thumbnailUrl}
                      alt={result.photoTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 672px) 100vw, 672px"
                    />
                  </div>
                </div>
              )}

              {/* License Details */}
              <div className="space-y-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                    License Code
                  </p>
                  <p className="font-mono text-lg font-bold tracking-wider text-brand-primary">
                    {result.licenseCode}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                    <ImageIcon className="mt-0.5 h-5 w-5 text-brand-primary" />
                    <div>
                      <p className="text-xs text-gray-500">Photo Title</p>
                      <p className="font-medium text-brand-dark">
                        {result.photoTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                    <Camera className="mt-0.5 h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-xs text-gray-500">Photographer</p>
                      <p className="font-medium text-brand-dark">
                        {result.photographerName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                    <Tag className="mt-0.5 h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="font-medium capitalize text-brand-dark">
                        {result.category || "General"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                    <CreditCard className="mt-0.5 h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="font-medium text-brand-dark">
                        NPR {result.priceNPR}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                    <Calendar className="mt-0.5 h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Purchase Date</p>
                      <p className="font-medium text-brand-dark">
                        {formatDate(result.purchaseDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                    <User className="mt-0.5 h-5 w-5 text-teal-500" />
                    <div>
                      <p className="text-xs text-gray-500">Licensed To</p>
                      <p className="font-medium text-brand-dark">
                        {result.buyerEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-sm text-green-700">
                    <strong>License Type:</strong>{" "}
                    {result.licenseType === "standard"
                      ? "Standard Commercial License"
                      : "Extended License"}
                  </p>
                  {result.hasWatermark && (
                    <p className="mt-1 text-xs text-green-600">
                      🔒 This photo contains an invisible embedded watermark
                      matching this license code
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── INVALID LICENSE ── */}
        {!loading && searched && notFound && (
          <div className="overflow-hidden rounded-2xl border-2 border-red-200 bg-white shadow-card">
            <div className="flex items-center gap-3 bg-red-50 px-6 py-4">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">
                  ❌ Invalid License
                </p>
                <p className="text-sm text-red-600">
                  This license code was not found in our system
                </p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                The code{" "}
                <span className="font-mono font-semibold">{code}</span> is not
                a valid WildSaura Market license. This could mean:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <ShieldX className="mt-0.5 h-4 w-4 text-red-400" />
                  The code is incorrect — please double check
                </li>
                <li className="flex items-start gap-2">
                  <ShieldX className="mt-0.5 h-4 w-4 text-red-400" />
                  The photo was not purchased through WildSaura Market
                </li>
                <li className="flex items-start gap-2">
                  <ShieldX className="mt-0.5 h-4 w-4 text-red-400" />
                  The license may have been revoked
                </li>
              </ul>
              <p className="mt-4 text-xs text-gray-400">
                If you believe this is an error, contact{" "}
                <a
                  href="mailto:support@wildsaura.com"
                  className="text-brand-primary hover:underline"
                >
                  support@wildsaura.com
                </a>
              </p>
            </div>
          </div>
        )}

        {/* How it works */}
        {!searched && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-4 font-semibold text-brand-dark">
              How License Verification Works
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">
                  1
                </span>
                <p>
                  Every photo purchased from WildSaura Market comes with a{" "}
                  <strong>unique license code</strong> in the download ZIP
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">
                  2
                </span>
                <p>
                  The code is also <strong>invisibly embedded</strong> in the
                  photo pixels — zoom in or adjust contrast to see it
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">
                  3
                </span>
                <p>
                  Enter the code above to verify it&apos;s a{" "}
                  <strong>genuine licensed purchase</strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
