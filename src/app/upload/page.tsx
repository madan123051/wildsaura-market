"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Upload,
  Camera,
  Sparkles,
  Loader2,
  X,
  Tag,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ImageIcon,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { CATEGORIES } from "@/types";
import type { PhotoCategory } from "@/types";
import toast from "react-hot-toast";

interface AiResult {
  is_marketable: boolean;
  rejection_reason: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  quality_score: number;
  market_demand: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step tracking
  const [step, setStep] = useState<"select" | "analyzing" | "edit" | "uploading" | "done">("select");

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // AI-generated fields (editable)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState<PhotoCategory>("nature");
  const [priceNPR, setPriceNPR] = useState(100);
  const [qualityScore, setQualityScore] = useState(7);
  const [marketDemand, setMarketDemand] = useState("Medium");

  // AI marketability pre-check
  const [isMarketable, setIsMarketable] = useState<boolean | null>(null); // null = not checked yet
  const [rejectionReason, setRejectionReason] = useState("");

  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // ─── Handle File Selection ──────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image must be under 15MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStep("analyzing");

    // Upload to Firebase Storage first, then analyze with AI
    uploadAndAnalyze(file);
  };

  // ─── Upload to Storage + AI Analyze ─────────────────────
  const uploadAndAnalyze = async (file: File) => {
    if (!user) return;
    setAiError("");

    try {
      // 1. Upload to Firebase Storage
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const storageRef = ref(storage, `marketplace/${user.uid}/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setImageUrl(downloadUrl);

      // 2. Call Gemini AI to analyze
      try {
        const aiResp = await fetch("/api/ai-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: downloadUrl }),
        });

        if (aiResp.ok) {
          const aiData: AiResult = await aiResp.json();
          setTitle(aiData.title || "");
          setDescription(aiData.description || "");
          setTags(aiData.tags || []);
          setCategory((aiData.category as PhotoCategory) || "nature");
          setQualityScore(aiData.quality_score || 7);
          setMarketDemand(aiData.market_demand || "Medium");

          // Marketability pre-check
          setIsMarketable(aiData.is_marketable ?? true);
          setRejectionReason(aiData.rejection_reason || "");

          // Suggest price based on quality & demand
          const basePrice = aiData.quality_score >= 8 ? 200 : aiData.quality_score >= 6 ? 150 : 100;
          const demandMultiplier = aiData.market_demand === "High" ? 1.5 : aiData.market_demand === "Medium" ? 1.2 : 1;
          setPriceNPR(Math.round(basePrice * demandMultiplier));
        } else {
          setAiError("AI analysis failed — please fill in the details manually.");
        }
      } catch {
        setAiError("AI analysis failed — please fill in the details manually.");
      }

      setStep("edit");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload image. Please try again.");
      setStep("select");
    }
  };

  // ─── Add Tag ────────────────────────────────────────────
  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag) && tags.length < 25) {
      setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // ─── Submit Listing ─────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imageUrl) return;

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (priceNPR < 10) {
      toast.error("Minimum price is NPR 10");
      return;
    }

    setStep("uploading");

    try {
      await addDoc(collection(db, "photos"), {
        ownerId: user.uid,
        ownerName: profile?.displayName || user.displayName || "Unknown",
        ownerAvatar: profile?.avatarUrl || user.photoURL || "",
        imageUrl: imageUrl,
        thumbnailUrl: imageUrl,
        title: title.trim(),
        description: description.trim(),
        tags,
        category,
        priceNPR,
        status: isMarketable === false ? "appeal" : "pending",
        isPublic: false,
        salesCount: 0,
        viewCount: 0,
        downloadCount: 0,
        qualityScore,
        aiQualityScore: qualityScore,
        marketDemand,
        aiRejected: isMarketable === false,
        aiRejectionReason: rejectionReason,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setStep("done");
      toast.success(
        isMarketable === false
          ? "Appeal submitted for admin review 📩"
          : "Photo submitted for review! 🎉"
      );
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to submit. Please try again.");
      setStep("edit");
    }
  };

  // ─── Cancel / Start Over ────────────────────────────────
  const handleStartOver = () => {
    setImageFile(null);
    setImagePreview("");
    setImageUrl("");
    setTitle("");
    setDescription("");
    setTags([]);
    setCategory("nature");
    setPriceNPR(100);
    setQualityScore(7);
    setMarketDemand("Medium");
    setAiError("");
    setIsMarketable(null);
    setRejectionReason("");
    setStep("select");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sell Your Photo
        </h1>
        <p className="text-gray-500 mb-8">
          Upload a photo and our AI will automatically generate title, description & tags for you.
        </p>

        {/* ─── Step: Select Image ─────────────────────────── */}
        {step === "select" && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 rounded-2xl p-16 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all"
          >
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Click to select a photo
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              JPG, PNG or WebP · Max 15MB
            </p>
            <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium">
              <Upload className="w-4 h-4" />
              Choose Photo
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* ─── Step: Analyzing with AI ────────────────────── */}
        {step === "analyzing" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            {imagePreview && (
              <div className="relative w-full max-w-md mx-auto aspect-[4/3] rounded-xl overflow-hidden mb-6">
                <Image src={imagePreview} alt="Uploading" fill className="object-cover" />
              </div>
            )}
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-emerald-600 animate-pulse" />
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI is analyzing your photo...
            </h3>
            <p className="text-sm text-gray-500">
              Generating title, description, tags & pricing automatically
            </p>
          </div>
        )}

        {/* ─── Step: Edit Details ──────────────────────────── */}
        {step === "edit" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Preview (NOT changeable) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative w-full aspect-[16/9] bg-gray-100">
                {imagePreview && (
                  <Image src={imagePreview} alt="Preview" fill className="object-contain" />
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleStartOver}
                    className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove & Start Over
                  </button>
                </div>
              </div>
              <div className="p-4 bg-amber-50 border-t border-amber-200">
                <div className="flex items-center gap-2 text-amber-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Photo cannot be changed after selection. To use a different photo, click &quot;Remove &amp; Start Over&quot;.
                  </span>
                </div>
              </div>
            </div>

            {/* AI Status */}
            {aiError ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {aiError}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                AI has auto-filled the details below. You can edit them before submitting.
              </div>
            )}

            {/* AI Marketability Result */}
            {isMarketable === true && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                AI approved! Your photo meets marketplace quality standards.
              </div>
            )}

            {isMarketable === false && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-800 text-sm font-semibold mb-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  AI Review: This image may not meet marketplace standards
                </div>
                <p className="text-sm text-red-700 mb-3">{rejectionReason}</p>
                <p className="text-xs text-red-600/80">
                  You can still submit this photo for admin review. The admin will make the final decision.
                </p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-4 h-4" />
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                required
                maxLength={100}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-4 h-4" />
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your photo..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/500</p>
            </div>

            {/* Category & Price Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <ImageIcon className="w-4 h-4" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PhotoCategory)}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <DollarSign className="w-4 h-4" />
                  Price (NPR) *
                </label>
                <input
                  type="number"
                  value={priceNPR}
                  onChange={(e) => setPriceNPR(Number(e.target.value))}
                  min={10}
                  max={50000}
                  required
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* AI Quality & Demand (read-only info) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">AI Quality Score</p>
                <p className="text-xl font-bold text-gray-900">{qualityScore}/10</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Market Demand</p>
                <p className={`text-xl font-bold ${
                  marketDemand === "High" ? "text-emerald-600" : marketDemand === "Medium" ? "text-blue-600" : "text-gray-600"
                }`}>{marketDemand}</p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Tag className="w-4 h-4" />
                Tags ({tags.length}/25)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Type a tag and press Enter"
                  className="flex-1 px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
              >
                <Upload className="w-5 h-5" />
                {isMarketable === false ? "Request Admin Review" : "Submit for Review"}
              </button>
              <button
                type="button"
                onClick={handleStartOver}
                className="px-6 py-4 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* ─── Step: Uploading ────────────────────────────── */}
        {step === "uploading" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Submitting your photo...
            </h3>
            <p className="text-sm text-gray-500">
              This will only take a moment
            </p>
          </div>
        )}

        {/* ─── Step: Done ─────────────────────────────────── */}
        {step === "done" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            {isMarketable === false ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Appeal Submitted! 📩
                </h3>
                <p className="text-gray-500 mb-8">
                  Our AI flagged this photo, but your appeal has been sent to the admin for manual review.
                  The admin will make the final decision.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Photo Submitted! 🎉
                </h3>
                <p className="text-gray-500 mb-8">
                  Your photo has been submitted for admin review. Once approved, it will appear in the marketplace.
                </p>
              </>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleStartOver}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Upload Another
              </button>
              <button
                onClick={() => router.push("/dashboard?tab=listings")}
                className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                View My Listings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
