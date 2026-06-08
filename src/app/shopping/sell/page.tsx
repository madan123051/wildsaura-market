"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useVerificationGuard } from "@/hooks/useVerificationGuard";
import { redirectToIdentityVerify, MARKET_URL } from "@/lib/identity";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
  EQUIPMENT_CATEGORIES,
  type EquipmentCategory,
  type EquipmentCondition,
} from "@/types";

interface AIRecognitionResult {
  itemName: string;
  category: EquipmentCategory;
  priceRange: { min: number; max: number };
  confidence: number;
  suggestions: string[];
}

interface FormData {
  title: string;
  description: string;
  category: EquipmentCategory;
  price: string;
  condition: EquipmentCondition;
  brand: string;
  model: string;
  yearPurchased: string;
  location: string;
  tags: string[];
  images: File[];
  imagePreviews: string[];
}

const STEP_INFO = [
  { num: 1, label: "Photos", icon: "📷" },
  { num: 2, label: "Details", icon: "✏️" },
  { num: 3, label: "Publish", icon: "🚀" },
];

export default function SellPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { verificationStatus, checking } = useVerificationGuard("/shopping/sell");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIRecognitionResult | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    category: "other",
    price: "",
    condition: "used",
    brand: "",
    model: "",
    yearPurchased: "",
    location: "",
    tags: [],
    images: [],
    imagePreviews: [],
  });

  useEffect(() => {
    if (loading || checking) return;
    if (!user) { router.push("/login"); return; }
    if (verificationStatus === "not_started" || verificationStatus === "rejected") {
      redirectToIdentityVerify(`${MARKET_URL}/shopping/sell`);
      return;
    }
  }, [user, loading, checking, verificationStatus, router]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
          <p className="text-gray-400 text-sm">Checking verification…</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === "pending") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-4xl mx-auto mb-6">
            ⏳
          </div>
          <h1 className="text-2xl font-bold mb-3">Verification Under Review</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Your identity verification is being reviewed by the WildSaura team.
            You&apos;ll be able to list equipment once approved — this usually takes 24–48 hours.
          </p>
          <button
            onClick={() => router.push("/shopping")}
            className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/15 transition"
          >
            ← Browse Equipment
          </button>
        </div>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = Array.from(files).slice(0, 5 - form.images.length);
    const newPreviews = newImages.map((f) => URL.createObjectURL(f));
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
      imagePreviews: [...prev.imagePreviews, ...newPreviews],
    }));
    if (newImages.length > 0 && !aiResult) await analyzeImage(newImages[0]);
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    try {
      await new Promise((r) => setTimeout(r, 2000));
      const mockResult: AIRecognitionResult = {
        itemName: "Professional Digital Camera",
        category: "camera",
        priceRange: { min: 45000, max: 80000 },
        confidence: 0.92,
        suggestions: [
          "Check if all accessories are included",
          "Mention warranty status if applicable",
          "Include shutter count for cameras",
          "Describe any cosmetic damage clearly",
        ],
      };
      setAiResult(mockResult);
      setForm((prev) => ({
        ...prev,
        title: mockResult.itemName,
        category: mockResult.category,
        price: String(mockResult.priceRange.min),
      }));
      setStep(2);
    } catch {
      setError("Failed to analyze image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && form.tags.length < 5) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || form.images.length === 0) {
      setError("Please fill all required fields and upload at least one image");
      return;
    }
    if (!user || !profile) { setError("You must be logged in."); return; }
    setIsSubmitting(true);
    setError("");
    try {
      const imageUrls: string[] = [];
      const timestamp = Date.now();
      for (let i = 0; i < form.images.length; i++) {
        const file = form.images[i];
        const storageRef = ref(storage, `equipmentListings/${user.uid}/${timestamp}/${i}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        imageUrls.push(await getDownloadURL(snapshot.ref));
      }
      await addDoc(collection(db, "equipmentListings"), {
        sellerId: user.uid,
        sellerName: profile.displayName || user.displayName || "Anonymous",
        sellerAvatar: profile.avatarUrl || user.photoURL || "",
        sellerEmail: user.email || "",
        title: form.title,
        description: form.description,
        category: form.category,
        priceNPR: Number(form.price),
        condition: form.condition,
        imageUrls,
        thumbnailUrl: imageUrls[0],
        brand: form.brand || "",
        model: form.model || "",
        yearPurchased: form.yearPurchased ? Number(form.yearPurchased) : null,
        tags: form.tags,
        location: form.location || "",
        contactPreference: "wildsaura-message",
        viewCount: 0,
        salesCount: 0,
        status: "active",
        isVerified: profile.isVerified || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSuccess("🎉 Listing published!");
      setTimeout(() => router.push("/shopping"), 2000);
    } catch (err) {
      console.error(err);
      setError("Failed to publish listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500" />

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-400 bg-clip-text text-transparent">
            Sell Equipment
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Reach thousands of photographers in minutes</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEP_INFO.map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <button
                onClick={() => { if (step > s.num) setStep(s.num as 1 | 2 | 3); }}
                className="flex flex-col items-center gap-1 transition-all"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  step === s.num
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30 scale-110"
                    : step > s.num
                    ? "bg-gradient-to-br from-violet-700/40 to-fuchsia-700/40 text-violet-300"
                    : "bg-white/5 text-gray-600"
                }`}>
                  {step > s.num ? "✓" : s.icon}
                </div>
                <span className={`text-xs font-semibold transition-colors ${step >= s.num ? "text-gray-300" : "text-gray-600"}`}>
                  {s.label}
                </span>
              </button>
              {idx < STEP_INFO.length - 1 && (
                <div className={`w-16 h-px mx-2 mb-4 transition-all duration-500 ${step > s.num ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
            {success}
          </div>
        )}

        {/* STEP 1: Photos */}
        {step === 1 && (
          <div className="space-y-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const files = e.dataTransfer.files;
                if (files) handleImageUpload({ target: { files } } as any);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-12 text-center ${
                dragOver
                  ? "border-violet-400 bg-violet-500/10"
                  : "border-white/10 bg-white/[0.03] hover:border-violet-500/40 hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex flex-col items-center gap-3 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center text-3xl">
                  📸
                </div>
                <div>
                  <p className="font-bold text-white text-lg">Drop photos here</p>
                  <p className="text-gray-500 text-sm mt-1">or click to browse · up to 5 images</p>
                </div>
                <div className="mt-2 px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold">
                  Browse Files
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {form.imagePreviews.length > 0 && (
              <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-gray-300">{form.imagePreviews.length}/5 photos added</p>
                  {form.imagePreviews.length < 5 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-violet-400 hover:text-violet-300 font-semibold">
                      + Add more
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {form.imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded font-bold">Cover</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (form.imagePreviews.length > 0) setStep(2);
                else setError("Please upload at least one photo");
              }}
              disabled={isAnalyzing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-lg hover:shadow-2xl hover:shadow-violet-500/20 transition-all disabled:opacity-40"
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing image…
                </span>
              ) : "Continue to Details →"}
            </button>
          </div>
        )}

        {/* STEP 2: Details */}
        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-5">
            {aiResult && (
              <div className="px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm flex gap-3">
                <span className="text-lg">🤖</span>
                <div>
                  <p className="font-semibold">AI detected: <span className="text-white">{aiResult.itemName}</span></p>
                  <p className="text-violet-400 text-xs mt-0.5">All fields are editable below</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition"
                placeholder="e.g. Canon EOS 6D Mark II"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as EquipmentCategory })}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-violet-500/50 transition appearance-none"
                >
                  {EQUIPMENT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value} className="bg-[#1a1a2e]">{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Condition</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value as EquipmentCondition })}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-violet-500/50 transition appearance-none"
                >
                  <option value="like-new" className="bg-[#1a1a2e]">✨ Like New</option>
                  <option value="used" className="bg-[#1a1a2e]">👍 Used</option>
                  <option value="fair" className="bg-[#1a1a2e]">⚠️ Fair</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Price (NPR) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition"
                  placeholder="45,000"
                />
              </div>
              {aiResult && (
                <p className="text-xs text-gray-500 mt-1">Suggested: ₹{aiResult.priceRange.min.toLocaleString()} – ₹{aiResult.priceRange.max.toLocaleString()}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Brand</label>
                <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition"
                  placeholder="Canon" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Model</label>
                <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition"
                  placeholder="EOS 6D Mark II" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition resize-none"
                rows={4} placeholder="Condition, accessories included, any wear or damage…" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition"
                placeholder="Kathmandu, Nepal" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Tags <span className="normal-case text-gray-600">(up to 5)</span></label>
              <div className="flex gap-2">
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition"
                  placeholder="wildlife, macro, sports…" />
                <button type="button" onClick={addTag}
                  className="px-4 py-3 rounded-xl bg-white/10 text-gray-300 font-semibold hover:bg-white/15 transition text-sm">Add</button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.tags.map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/15 text-violet-300 text-xs font-semibold border border-violet-500/20">
                      {tag}
                      <button type="button" onClick={() => removeTag(idx)} className="hover:text-white transition">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-2xl border border-white/10 text-gray-400 font-semibold hover:bg-white/5 transition">
                ← Back
              </button>
              <button type="submit"
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:shadow-2xl hover:shadow-violet-500/20 transition-all">
                Preview Listing →
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Review & Publish */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Preview Card */}
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
              {form.imagePreviews.length > 0 && (
                <div className="relative aspect-video w-full bg-black/40 overflow-hidden">
                  <img src={form.imagePreviews[0]} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {form.imagePreviews.length > 1 && (
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      {form.imagePreviews.slice(1).map((p, i) => (
                        <img key={i} src={p} alt="" className="w-10 h-10 rounded-lg object-cover border-2 border-white/20" />
                      ))}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur text-white text-xs font-bold border border-white/20">
                    {form.condition === "like-new" ? "✨ Like New" : form.condition === "used" ? "👍 Used" : "⚠️ Fair"}
                  </div>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{form.title || "—"}</h2>
                    {(form.brand || form.model) && (
                      <p className="text-gray-500 text-sm mt-0.5">{form.brand} {form.model}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                      ₹{Number(form.price || 0).toLocaleString()}
                    </p>
                    <p className="text-gray-600 text-xs">NPR</p>
                  </div>
                </div>
                {form.description && <p className="text-gray-400 text-sm leading-relaxed mb-4">{form.description}</p>}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-500"><span>📂</span><span>{form.category}</span></div>
                  {form.location && <div className="flex items-center gap-2 text-gray-500"><span>📍</span><span>{form.location}</span></div>}
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {form.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-white/5 text-gray-500 text-xs border border-white/10">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Checklist */}
            <div className="px-5 py-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3">Pre-publish checklist</p>
              <ul className="space-y-2 text-sm text-gray-400">
                {["Photos are clear and well-lit", "Description is accurate and honest", "Price is fair and competitive", "Equipment is yours to sell"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span>{item}</li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)}
                className="flex-1 py-3.5 rounded-2xl border border-white/10 text-gray-400 font-semibold hover:bg-white/5 transition">
                ← Edit
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-lg hover:shadow-2xl hover:shadow-emerald-500/20 transition-all disabled:opacity-40">
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publishing…
                  </span>
                ) : "🚀 Publish Now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
