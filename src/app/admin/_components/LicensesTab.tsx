import { useEffect, useState } from "react";
import { collection, doc, getDocs, orderBy, query, Timestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle, CheckCircle2, EyeIcon, RefreshCw, Search, Shield, ShieldCheck, XCircle } from "lucide-react";

export function LicensesTab() {
  const [searchCode, setSearchCode] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentLicenses, setRecentLicenses] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Load recent licenses on mount
  useEffect(() => {
    async function loadRecent() {
      try {
        const q = query(
          collection(db, "licenses"),
          orderBy("downloadDate", "desc"),
        );
        const snap = await getDocs(q);
        setRecentLicenses(snap.docs.slice(0, 20).map((d: any) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load recent licenses:", err);
      } finally {
        setLoadingRecent(false);
      }
    }
    loadRecent();
  }, []);

  async function handleSearch() {
    const code = searchCode.trim().toUpperCase();
    const email = searchEmail.trim().toLowerCase();
    if (!code && !email) {
      toast.error("Enter a license code or buyer email");
      return;
    }

    setLoading(true);
    setSearched(true);
    setLicenses([]);

    try {
      let results: any[] = [];

      if (code) {
        const q = query(collection(db, "licenses"), where("licenseCode", "==", code));
        const snap = await getDocs(q);
        results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      }

      if (email && results.length === 0) {
        const q = query(collection(db, "licenses"), where("buyerEmail", "==", email));
        const snap = await getDocs(q);
        results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      }

      setLicenses(results);
      if (results.length === 0) toast.error("No licenses found");
      else toast.success(`Found ${results.length} license(s)`);
    } catch (err) {
      console.error("License search error:", err);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function toggleLicenseValidity(licenseId: string, currentlyValid: boolean) {
    try {
      await updateDoc(doc(db, "licenses", licenseId), { isValid: !currentlyValid });
      toast.success(currentlyValid ? "License revoked ❌" : "License restored ✅");
      // Update local state
      setLicenses((prev: any) =>
        prev.map((l: any) => (l.id === licenseId ? { ...l, isValid: !currentlyValid } : l))
      );
      setRecentLicenses((prev: any) =>
        prev.map((l: any) => (l.id === licenseId ? { ...l, isValid: !currentlyValid } : l))
      );
    } catch {
      toast.error("Failed to update license");
    }
  }

  function formatDate(d: any): string {
    if (!d) return "N/A";
    const date = d.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function LicenseRow({ license }: { license: any }) {
    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="px-4 py-3">
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{license.licenseCode}</span>
        </td>
        <td className="px-4 py-3 text-sm">{license.photoTitle || "Untitled"}</td>
        <td className="px-4 py-3 text-sm">{license.buyerEmail || "N/A"}</td>
        <td className="px-4 py-3 text-sm">{license.photographerName || "N/A"}</td>
        <td className="px-4 py-3 text-sm">{formatDate(license.downloadDate)}</td>
        <td className="px-4 py-3">
          {license.isValid ? (
            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Valid
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              <XCircle className="w-3 h-3" /> Revoked
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => toggleLicenseValidity(license.id, license.isValid)}
            className={`text-xs px-3 py-1 rounded-lg font-semibold ${
              license.isValid
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-green-50 text-green-600 hover:bg-green-100"
            }`}
          >
            {license.isValid ? "Revoke" : "Restore"}
          </button>
        </td>
      </tr>
    );
  }

  const displayLicenses = searched ? licenses : recentLicenses;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          License Management
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Search, verify, and manage photo licenses. Each downloaded photo gets a unique license with an embedded invisible watermark.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">🔍 Search Licenses</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="License Code (WS-XXXX-XXXX)"
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buyer Email"
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* How Watermark Works */}
      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
        <h3 className="text-sm font-bold text-blue-800 mb-2">🔒 How License Watermarks Work</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Every downloaded photo has an <strong>invisible watermark</strong> embedded at 3 positions (bottom-right, top-left, center)</p>
          <p>• Watermark contains the unique license code (e.g., WS-XXXXXX-XXXXXXXX)</p>
          <p>• To verify: zoom into the photo and increase contrast — the code becomes visible</p>
          <p>• Each license is tracked in Firestore with buyer info, photo details, and timestamps</p>
          <p>• Public verification page: <a href="/verify" className="underline font-semibold">market.wildsaura.com/verify</a></p>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">
            {searched ? `Search Results (${licenses.length})` : `Recent Licenses (${recentLicenses.length})`}
          </h3>
          {searched && (
            <button
              onClick={() => { setSearched(false); setSearchCode(""); setSearchEmail(""); }}
              className="text-xs text-emerald-600 hover:underline"
            >
              Show Recent
            </button>
          )}
        </div>

        {loadingRecent && !searched ? (
          <div className="p-8 text-center text-gray-400">Loading licenses...</div>
        ) : displayLicenses.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {searched ? "No licenses found" : "No licenses yet — they appear when buyers download photos"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Photo</th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Buyer</th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Photographer</th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayLicenses.map((license: any) => (
                  <LicenseRow key={license.id} license={license} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}








