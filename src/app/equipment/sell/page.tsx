"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ImagePlus,
  Loader2,
  MapPin,
  Package,
  Phone,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { EQUIPMENT_CATEGORIES } from "@/types";
import type { EquipmentCategory, EquipmentCondition, EquipmentContactPreference, EquipmentListing } from "@/types";

const CONDITIONS: { value: EquipmentCondition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like New" },
  { value: "used", label: "Used" },
  { value: "refurbished", label: "Refurbished" },
];

const CONTACT_PREFERENCES: { value: EquipmentContactPreference; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "wildsaura-message", label: "WildSaura Message" },
];

const emptyForm = {
  title: "",
  brand: "",
  category: "camera" as EquipmentCategory,
  condition: "used" as EquipmentCondition,
  priceNPR: "",
  description: "",
  location: "",
  contactPreference: "email" as EquipmentContactPreference,
  sellerPhone: "",
};

export default function SellEquipmentPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingListing, setLoadingListing] = useState(Boolean(editId));

  const isEditing = Boolean(editId);
  const previews = useMemo(() => imageFiles.map((file) => URL.createObjectURL(file)), [imageFiles]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    async function loadListing() {
      if (!editId || !user) return;

      setLoadingListing(true);
      try {
        const snapshot = await getDoc(doc(db, "equipmentListings", editId));
        if (!snapshot.exists()) {
          toast.error("Equipment listing not found");
          router.push("/dashboard?tab=equipment");
          return;
        }

        const listing = { id: snapshot.id, ...snapshot.data() } as EquipmentListing;
        if (listing.sellerId !== user.uid) {
          toast.error("You can only edit your own equipment listings");
          router.push("/dashboard?tab=equipment");
          return;
        }

        setForm({
          title: listing.title || "",
          brand: listing.brand || "",
          category: listing.category || "camera",
          condition: listing.condition || "used",
          priceNPR: String(listing.priceNPR || ""),
          description: listing.description || "",
          location: listing.location || "",
          contactPreference: listing.contactPreference || "email",
          sellerPhone: listing.sellerPhone || "",
        });
        setExistingImages(listing.imageUrls?.length ? listing.imageUrls : listing.thumbnailUrl ? [listing.thumbnailUrl] : []);
      } catch (error) {
        console.error("Error loading equipment listing:", error);
        toast.error("Failed to load equipment listing");
      } finally {
        setLoadingListing(false);
      }
    }

    loadListing();
  }, [editId, router, user]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const updateForm = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const uploadImages = async () => {
    if (!user) return [];

    const uploads = imageFiles.map(async (file, index) => {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const storageRef = ref(
        storage,
        `equipmentListings/${user.uid}/${Date.now()}-${index}-${safeName}`
      );
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });

    return Promise.all(uploads);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const price = Number(form.priceNPR);
    if (!form.title.trim()) {
      toast.error("Equipment Name is required");
      return;
    }
    if (!form.brand.trim()) {
      toast.error("Brand is required");
      return;
    }
    if (!price || price <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!form.location.trim()) {
      toast.error("Location is required");
      return;
    }
    if (!isEditing && imageFiles.length === 0) {
      toast.error("Add at least one equipment image");
      return;
    }

    setSubmitting(true);
    try {
      const uploadedImageUrls = await uploadImages();
      const imageUrls = [...existingImages, ...uploadedImageUrls];
      const listingData = {
        sellerId: user.uid,
        sellerName: profile?.displayName || user.displayName || user.email || "WildSaura Seller",
        sellerAvatar: profile?.avatarUrl || user.photoURL || "",
        sellerEmail: user.email || "",
        sellerPhone: form.sellerPhone.trim(),
        title: form.title.trim(),
        brand: form.brand.trim(),
        category: form.category,
        condition: form.condition,
        priceNPR: price,
        description: form.description.trim(),
        imageUrls,
        thumbnailUrl: imageUrls[0],
        location: form.location.trim(),
        contactPreference: form.contactPreference,
        tags: [form.brand.trim().toLowerCase(), form.category],
        model: "",
        viewCount: 0,
        salesCount: 0,
        status: "active" as const,
        isVerified: profile?.isVerified || false,
        updatedAt: serverTimestamp(),
      };

      if (isEditing && editId) {
        await updateDoc(doc(db, "equipmentListings", editId), listingData);
        toast.success("Equipment listing updated");
      } else {
        await addDoc(collection(db, "equipmentListings"), {
          ...listingData,
          createdAt: serverTimestamp(),
        });
        toast.success("Equipment listing published");
      }

      router.push("/dashboard?tab=equipment");
    } catch (error) {
      console.error("Error publishing equipment listing:", error);
      toast.error("Failed to publish listing");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingListing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 mb-6">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Package className="h-8 w-8 text-emerald-600" />
                <h1 className="text-3xl font-bold text-gray-900">Sell Equipment</h1>
              </div>
              <p className="text-gray-600">
                Publish photography gear directly inside WildSaura Market. Photo uploads and photo licensing still stay on Drishya.
              </p>
            </div>
            <Link href="/shopping" className="inline-flex items-center justify-center rounded-xl border border-emerald-200 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              Browse Equipment
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 flex gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-emerald-950">Internal equipment seller flow</h2>
              <p className="text-sm text-emerald-800">
                This form creates a WildSaura Market equipment listing and does not redirect to Drishya.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Equipment Name *</span>
              <input
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Canon EOS R6 Mark II"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Brand *</span>
              <input
                value={form.brand}
                onChange={(e) => updateForm("brand", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Canon, Nikon, Sony..."
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Category *</span>
              <select
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {EQUIPMENT_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Condition *</span>
              <select
                value={form.condition}
                onChange={(e) => updateForm("condition", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {CONDITIONS.map((condition) => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Price (NPR) *</span>
              <input
                type="number"
                min="1"
                value={form.priceNPR}
                onChange={(e) => updateForm("priceNPR", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="85000"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Location *</span>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={form.location}
                  onChange={(e) => updateForm("location", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Kathmandu, Nepal"
                />
              </div>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Description *</span>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Describe condition, included accessories, warranty, usage history, and reason for selling."
            />
          </label>

          <div>
            <span className="text-sm font-semibold text-gray-700">Images *</span>
            <label className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center hover:border-emerald-300 hover:bg-emerald-50/60">
              <ImagePlus className="h-8 w-8 text-emerald-600 mb-2" />
              <span className="font-medium text-gray-900">Upload equipment images</span>
              <span className="text-sm text-gray-500">Choose one or more JPG, PNG, or WebP images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
              />
            </label>

            {(existingImages.length > 0 || previews.length > 0) && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...existingImages, ...previews].map((src, index) => (
                  <div key={`${src}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                    <Image src={src} alt={`Equipment image ${index + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Contact Preference *</span>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.contactPreference}
                  onChange={(e) => updateForm("contactPreference", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {CONTACT_PREFERENCES.map((preference) => (
                    <option key={preference.value} value={preference.value}>{preference.label}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Phone (optional)</span>
              <input
                value={form.sellerPhone}
                onChange={(e) => updateForm("sellerPhone", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="+977..."
              />
            </label>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Photo selling remains labeled as “Sell Photos” and continues through Drishya. Use this page only to sell cameras, lenses, accessories, and other equipment.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100 pt-6">
            <Link href="/dashboard?tab=equipment" className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
              Publish Listing
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
