"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

export default function SellPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIRecognitionResult | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files);
    const newPreviews = newImages.map((file) => URL.createObjectURL(file));

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
      imagePreviews: [...prev.imagePreviews, ...newPreviews],
    }));

    // Auto-analyze first image
    if (newImages.length > 0 && !aiResult) {
      await analyzeImage(newImages[0]);
    }
  };

  // AI Recognition - Analyze first image
  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis (in real app, send to backend API)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock AI result based on file name or detected features
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
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }));
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && form.tags.length < 5) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  // Remove tag
  const removeTag = (index: number) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  // Submit listing
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title || !form.price || form.images.length === 0) {
      setError("Please fill all required fields and upload at least one image");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Call API to create listing in Firebase
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess("Listing published successfully!");
      setTimeout(() => router.push("/shopping"), 2000);
    } catch (err) {
      setError("Failed to publish listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Start Selling
          </h1>
          <p className="text-gray-600">List your photography equipment and reach buyers instantly</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  s <= step
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {s}
              </div>
              <div
                className={`flex-1 h-1 mx-2 ${
                  s < step ? "bg-gradient-to-r from-blue-600 to-cyan-600" : "bg-gray-200"
                }`}
              ></div>
            </div>
          ))}
        </div>

        {/* Step Titles */}
        <div className="text-center mb-8">
          {step === 1 && <h2 className="text-2xl font-bold text-gray-800">📷 Upload Images</h2>}
          {step === 2 && <h2 className="text-2xl font-bold text-gray-800">🔍 Review & Edit Details</h2>}
          {step === 3 && <h2 className="text-2xl font-bold text-gray-800">✅ Review & Publish</h2>}
        </div>

        {/* Error & Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* STEP 1: Image Upload */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("border-blue-500", "bg-blue-50");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
                const files = e.dataTransfer.files;
                if (files) {
                  handleImageUpload({ target: { files } } as any);
                }
              }}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-400 transition"
            >
              <div className="text-5xl mb-4">📸</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Drag & drop your photos</h3>
              <p className="text-gray-600 mb-4">or click to browse (up to 5 images)</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
              >
                Browse Files
              </button>
            </div>

            {/* Image Previews */}
            {form.imagePreviews.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Uploaded Images ({form.imagePreviews.length}/5)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {form.imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Button */}
            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={() => {
                  if (form.imagePreviews.length > 0) {
                    setStep(2);
                  } else {
                    setError("Please upload at least one image");
                  }
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                disabled={form.imagePreviews.length === 0 || isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Next: Edit Details"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Edit Details */}
        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="bg-white rounded-xl shadow-lg p-8 mb-6 space-y-6">
            {/* AI Result Info */}
            {aiResult && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">🤖 AI Recognition:</p>
                <p className="text-sm text-blue-800">
                  Detected: <strong>{aiResult.itemName}</strong> (Confidence: {Math.round(aiResult.confidence * 100)}%)
                </p>
                <p className="text-xs text-blue-700 mt-2">All fields below are editable</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Canon EOS 6D Mark II"
              />
            </div>

            {/* Category & Price Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as EquipmentCategory })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {EQUIPMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="45000"
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value as EquipmentCondition })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="like-new">Like New</option>
                <option value="used">Used</option>
                <option value="fair">Fair</option>
              </select>
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Canon"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., EOS 6D Mark II"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe the condition, any damage, included accessories..."
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mumbai, Maharashtra"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (up to 5)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Add
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(idx)}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
              >
                Review Listing
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Review & Publish */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            {/* Images Preview */}
            <h3 className="text-lg font-bold text-gray-800 mb-4">Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {form.imagePreviews.map((preview, idx) => (
                <img
                  key={idx}
                  src={preview}
                  alt={`Item ${idx + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
              ))}
            </div>

            {/* Details Summary */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm text-gray-600">Title</p>
                <p className="font-bold text-gray-800">{form.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-bold text-lg text-green-600">₹{form.price}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-bold text-gray-800">{form.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Condition</p>
                <p className="font-bold text-gray-800">{form.condition}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Brand</p>
                <p className="font-bold text-gray-800">{form.brand || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Model</p>
                <p className="font-bold text-gray-800">{form.model || "—"}</p>
              </div>
            </div>

            {/* Description */}
            {form.description && (
              <div className="mb-8">
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-800 leading-relaxed">{form.description}</p>
              </div>
            )}

            {/* Tags */}
            {form.tags.length > 0 && (
              <div className="mb-8">
                <p className="text-sm text-gray-600 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h4 className="font-bold text-blue-900 mb-3">Before Publishing:</h4>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>✓ All photos are clear and well-lit</li>
                <li>✓ Item description is accurate and detailed</li>
                <li>✓ Price is competitive and fair</li>
                <li>✓ You have photographed equipment, not someone else\'s</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Edit Details
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {isSubmitting ? "Publishing..." : "🎉 Publish Listing"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
