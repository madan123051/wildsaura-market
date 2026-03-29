"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, ShieldCheck, ShieldX, Camera, User, Calendar, Tag, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<LicenseData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searchedCode, setSearchedCode] = useState("");

  // Extract code from URL on first load
  useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code");
      if (urlCode) {
        setCode(urlCode);
        handleSearch(urlCode);
      }
    }
  });

  async function handleSearch(searchCode?: string) {
    const lookupCode = (searchCode || code).trim().toUpperCase();
    if (!lookupCode) return;

    setSearching(true);
    setResult(null);
    setNotFound(false);
    setSearchedCode(lookupCode);

    try {
      const q = query(
        collection(db, "licenses"),
        where("licenseCode", "==", lookupCode)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setNotFound(true);
      } else {
        setResult(snap.docs[0].data() as LicenseData);
      }
    } catch (err) {
      console.error("License lookup error:", err);
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  }

  function formatDate(d: any): string {
    if (!d) return "N/A";
    const date = d.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-primary to-emerald-700 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <ShieldCheck className="h-14 w-14 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl md:text-4xl font-bold font-heading">
            License Verification
          </h1>
          <p className="text-white/80 mt-3 text-lg">
            Verify the authenticity of a WildSaura photo license
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto -mt-8 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Enter License Code
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="WS-XXXXXXXX-XXXXXXXX"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
            <button
              onClick={() => handleSearch()}
              disabled={searching || !code.trim()}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="h-5 w-5" />
              {searching ? "Checking..." : "Verify"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            License codes start with &quot;WS-&quot; and are included in your download ZIP&apos;s LICENSE.txt file
          </p>
        </div>
      </div>

      {/* Result */}
      <div className="max-w-2xl mx-auto mt-6 px-4 pb-16">
        {/* Valid License */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Status Banner */}
            <div className={`p-5 flex items-center gap-3 ${result.isValid ? "bg-green-50 border-b border-green-100" : "bg-red-50 border-b border-red-100"}`}>
              {result.isValid ? (
                <>
                  <div className="bg-green-100 rounded-full p-2">
                    <ShieldCheck className="h-7 w-7 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-green-800">✅ Valid License</h2>
                    <p className="text-green-600 text-sm">This license is authentic and active</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-red-100 rounded-full p-2">
                    <ShieldX className="h-7 w-7 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-red-800">❌ Revoked License</h2>
                    <p className="text-red-600 text-sm">This license has been revoked</p>
                  </div>
                </>
              )}
            </div>

            {/* Photo Preview */}
            {result.thumbnailUrl && (
              <div className="p-5 border-b border-gray-100">
                <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={result.thumbnailUrl}
                    alt={result.photoTitle || "Licensed photo"}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Details */}
            <div className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">License Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={<Tag className="h-4 w-4" />} label="License Code" value={result.licenseCode} mono />
                <InfoRow icon={<Tag className="h-4 w-4" />} label="License Type" value={(result.licenseType || "standard").charAt(0).toUpperCase() + (result.licenseType || "standard").slice(1)} />
                <InfoRow icon={<Camera className="h-4 w-4" />} label="Photo" value={result.photoTitle || "Untitled"} />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Category" value={(result.category || "General").toUpperCase()} />
                <InfoRow icon={<User className="h-4 w-4" />} label="Photographer" value={result.photographerName || "WildSaura Photographer"} />
                <InfoRow icon={<User className="h-4 w-4" />} label="Licensed To" value={result.buyerEmail ? result.buyerEmail.replace(/(.{3})(.*)(@.*)/, "$1***$3") : "N/A"} />
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Purchase Date" value={formatDate(result.purchaseDate)} />
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Download Date" value={formatDate(result.downloadDate)} />
              </div>

              {result.hasWatermark && (
                <div className="bg-blue-50 rounded-xl p-4 mt-4">
                  <p className="text-blue-700 text-sm">
                    🔒 <strong>Watermark Embedded</strong> — This photo contains an invisible digital watermark matching this license code. The watermark is embedded at multiple positions within the image for identification.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 text-center">
              <Link href="/explore" className="text-brand-primary hover:underline text-sm font-semibold">
                ← Back to WildSaura Market
              </Link>
            </div>
          </div>
        )}

        {/* Not Found */}
        {notFound && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="bg-orange-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mt-4">License Not Found</h2>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              No license matching <strong className="font-mono">{searchedCode}</strong> was found. Please double-check the code from your LICENSE.txt file.
            </p>
            <div className="mt-6 bg-amber-50 rounded-xl p-4 text-left text-sm text-amber-800">
              <p className="font-semibold mb-1">⚠️ Possible Reasons:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Typo in the license code</li>
                <li>Photo was obtained from an unauthorized source</li>
                <li>License code is from a different platform</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-semibold text-gray-800 ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
