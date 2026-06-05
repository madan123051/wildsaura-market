"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVerificationGuard } from "@/hooks/useVerificationGuard";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { CATEGORIES } from "@/types";
import type { PhotoCategory } from "@/types";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import toast from "react-hot-toast";
import {
  Upload,
  Camera,
  MapPin,
  User,
  Scale,
  Tag,
  Settings2,
  Sparkles,
  ChevronDown,
  X,
  Plus,
  Crop,
  RotateCw,
  ZoomIn,
  Trash2,
  Check,
  AlertTriangle,
  Info,
  Image as ImageIcon,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Send,
  Star,
  TrendingUp,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type FlowStep = "select" | "crop" | "analyzing" | "edit" | "uploading" | "done";

interface ExifData {
  Make?: string;
  Model?: string;
  LensModel?: string;
  FocalLength?: number;
  FocalLengthIn35mmFormat?: number;
  FNumber?: number;
  ExposureTime?: number;
  ISO?: number;
  DateTimeOriginal?: Date | string;
  GPSLatitude?: number;
  GPSLongitude?: number;
  WhiteBalance?: string | number;
  Flash?: string | number;
  Software?: string;
  ColorSpace?: string | number;
  ImageWidth?: number;
  ImageHeight?: number;
  ExposureProgram?: number;
  MeteringMode?: number;
}

interface AIAnalysis {
  qualityScore: number;
  marketDemand: string;
  isMarketable: boolean;
  rejectionReason: string;
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedTags: string[];
  suggestedCategory: PhotoCategory;
  suggestedLocation: string;
  suggestedCountry: string;
  suggestedPrice: number;
}

interface AspectRatioOption {
  label: string;
  value: number | undefined;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function formatShutterSpeed(exposureTime: number): string {
  if (exposureTime >= 1) return exposureTime + "s";
  return "1/" + Math.round(1 / exposureTime) + "s";
}

function formatAperture(fNumber: number): string {
  return "f/" + fNumber.toFixed(1);
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const rotRad = getRadianAngle(rotation);
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));

  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d")!;

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create cropped image blob"));
      },
      "image/jpeg",
      0.95
    );
  });
}

const extractExif = async (file: File): Promise<ExifData> => {
  try {
    const { default: exifr } = await import("exifr");
    const data = await exifr.parse(file, {
      pick: [
        "Make",
        "Model",
        "LensModel",
        "FocalLength",
        "FocalLengthIn35mmFormat",
        "FNumber",
        "ExposureTime",
        "ISO",
        "DateTimeOriginal",
        "GPSLatitude",
        "GPSLongitude",
        "WhiteBalance",
        "Flash",
        "Software",
        "ColorSpace",
        "ImageWidth",
        "ImageHeight",
        "ExposureProgram",
        "MeteringMode",
      ],
    });
    return (data as ExifData) || {};
  } catch {
    return {};
  }
};

const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
];

const INPUT_CLASS =
  "w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all";

const LABEL_CLASS = "block text-sm font-medium text-gray-700 mb-1.5";

// ─── Collapsible Section ─────────────────────────────────────────────────────

interface CollapsibleSectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  icon,
  title,
  subtitle,
  expanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-emerald-600">{icon}</span>
          <span className="font-semibold text-gray-900">{title}</span>
          {subtitle && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              {subtitle}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-5 pt-1 border-t border-gray-50">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UploadPage() {
  const { user, profile, loading } = useAuth();
  const { isVerified, verificationStatus, checking } = useVerificationGuard("/upload");

  // Flow state
  const [step, setStep] = useState<FlowStep>("select");

  // File & image state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [imageWidth, setImageWidth] = useState<number | null>(null);
  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  // Crop state
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(
    undefined
  );
  const [showCropModal, setShowCropModal] = useState(false);

  // EXIF state
  const [exifData, setExifData] = useState<ExifData>({});

  // AI state
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiFailed, setAiFailed] = useState(false);

  // Form fields — Basic
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PhotoCategory | "">("");
  const [priceNPR, setPriceNPR] = useState<number>(100);

  // Photographer
  const [photographerName, setPhotographerName] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [copyrightNotice, setCopyrightNotice] = useState("");

  // Location
  const [locationName, setLocationName] = useState("");
  const [country, setCountry] = useState("");
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);

  // Camera & Technical
  const [camera, setCamera] = useState("");
  const [lens, setLens] = useState("");
  const [focalLength, setFocalLength] = useState("");
  const [aperture, setAperture] = useState("");
  const [shutterSpeed, setShutterSpeed] = useState("");
  const [iso, setIso] = useState("");
  const [dateTaken, setDateTaken] = useState("");
  const [whiteBalance, setWhiteBalance] = useState("");
  const [colorSpace, setColorSpace] = useState("");
  const [software, setSoftware] = useState("");

  // Licensing
  const [licenseType, setLicenseType] = useState("Standard");
  const [modelRelease, setModelRelease] = useState("Not Required");
  const [propertyRelease, setPropertyRelease] = useState("Not Required");
  const [usageNotes, setUsageNotes] = useState("");

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Section collapse state
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    basic: true,
    photographer: true,
    location: true,
    camera: false,
    licensing: false,
    tags: true,
  });

  // Drag & drop
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Populate fields from profile ────────────────────────────────────────

  useEffect(() => {
    if (profile) {
      setPhotographerName(profile.displayName || "");
      setPortfolioUrl(profile.website || "");
      setCopyrightNotice(
        `\u00A9 ${new Date().getFullYear()} ${profile.displayName || ""}`
      );
    }
  }, [profile]);

  // ─── Populate form from EXIF ─────────────────────────────────────────────

  const populateFromExif = useCallback((exif: ExifData) => {
    if (exif.Make && exif.Model) {
      setCamera(`${exif.Make} ${exif.Model}`.trim());
    } else if (exif.Model) {
      setCamera(exif.Model);
    }
    if (exif.LensModel) setLens(exif.LensModel);
    if (exif.FocalLength) {
      const fl35 = exif.FocalLengthIn35mmFormat;
      setFocalLength(
        fl35
          ? `${exif.FocalLength}mm (${fl35}mm equiv.)`
          : `${exif.FocalLength}mm`
      );
    }
    if (exif.FNumber) setAperture(formatAperture(exif.FNumber));
    if (exif.ExposureTime) setShutterSpeed(formatShutterSpeed(exif.ExposureTime));
    if (exif.ISO) setIso(String(exif.ISO));
    if (exif.DateTimeOriginal) {
      const d =
        exif.DateTimeOriginal instanceof Date
          ? exif.DateTimeOriginal
          : new Date(exif.DateTimeOriginal);
      if (!isNaN(d.getTime())) {
        setDateTaken(d.toISOString().split("T")[0]);
      }
    }
    if (exif.WhiteBalance !== undefined) {
      const wb =
        typeof exif.WhiteBalance === "number"
          ? exif.WhiteBalance === 0
            ? "Auto"
            : "Manual"
          : String(exif.WhiteBalance);
      setWhiteBalance(wb);
    }
    if (exif.ColorSpace !== undefined) {
      const cs =
        typeof exif.ColorSpace === "number"
          ? exif.ColorSpace === 1
            ? "sRGB"
            : exif.ColorSpace === 65535
            ? "Uncalibrated"
            : `ColorSpace(${exif.ColorSpace})`
          : String(exif.ColorSpace);
      setColorSpace(cs);
    }
    if (exif.Software) setSoftware(exif.Software);
    if (exif.GPSLatitude != null && exif.GPSLongitude != null) {
      setGpsLat(exif.GPSLatitude);
      setGpsLng(exif.GPSLongitude);
    }
  }, []);

  // ─── Populate form from AI ───────────────────────────────────────────────

  const populateFromAI = useCallback((ai: AIAnalysis) => {
    if (ai.suggestedTitle) setTitle(ai.suggestedTitle);
    if (ai.suggestedDescription) setDescription(ai.suggestedDescription);
    if (ai.suggestedTags?.length) setTags(ai.suggestedTags.slice(0, 25));
    if (ai.suggestedCategory) setCategory(ai.suggestedCategory);
    if (ai.suggestedLocation) setLocationName(ai.suggestedLocation);
    if (ai.suggestedCountry) setCountry(ai.suggestedCountry);
    if (ai.suggestedPrice) setPriceNPR(ai.suggestedPrice);
  }, []);

  // ─── Toggle section ──────────────────────────────────────────────────────

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // ─── File selection ──────────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a JPG, PNG, or WebP file.");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error("File size must be under 15 MB.");
        return;
      }

      setSelectedFile(file);
      setFileSize(file.size);

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Get image dimensions
      const img = new window.Image();
      img.onload = () => {
        setImageWidth(img.naturalWidth);
        setImageHeight(img.naturalHeight);
      };
      img.src = objectUrl;

      // Extract EXIF
      const exif = await extractExif(file);
      setExifData(exif);
      populateFromExif(exif);

      // Move to crop step
      setStep("crop");
      setShowCropModal(true);
    },
    [populateFromExif]
  );

  const onDropHandler = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // ─── Crop handlers ──────────────────────────────────────────────────────

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApplyCrop = useCallback(async () => {
    if (!croppedAreaPixels || !previewUrl) return;
    try {
      const croppedBlob = await getCroppedImg(
        previewUrl,
        croppedAreaPixels,
        rotation
      );
      const croppedFile = new File([croppedBlob], selectedFile?.name || "cropped.jpg", {
        type: "image/jpeg",
      });
      setSelectedFile(croppedFile);
      setFileSize(croppedBlob.size);

      const newUrl = URL.createObjectURL(croppedBlob);
      setPreviewUrl(newUrl);

      const img = new window.Image();
      img.onload = () => {
        setImageWidth(img.naturalWidth);
        setImageHeight(img.naturalHeight);
      };
      img.src = newUrl;

      setShowCropModal(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      toast.success("Crop applied successfully!");
      startAnalyzing(croppedFile);
    } catch {
      toast.error("Failed to crop image. Please try again.");
    }
  }, [croppedAreaPixels, previewUrl, rotation, selectedFile]);

  const handleSkipCrop = useCallback(() => {
    setShowCropModal(false);
    if (selectedFile) {
      startAnalyzing(selectedFile);
    }
  }, [selectedFile]);

  // ─── Analyzing step ──────────────────────────────────────────────────────

  const startAnalyzing = useCallback(
    async (fileToUpload: File) => {
      setStep("analyzing");

      try {
        // Upload to Firebase Storage + AI Analysis in parallel
        const uploadPromise = (async () => {
          const fileExtension = fileToUpload.name.split(".").pop() || "jpg";
          const fileName = `photos/${user?.uid}/${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 9)}.${fileExtension}`;
          const storageRef = ref(storage, fileName);
          await uploadBytes(storageRef, fileToUpload);
          const downloadUrl = await getDownloadURL(storageRef);
          return downloadUrl;
        })();

        const aiPromise = (async () => {
          try {
            const formData = new FormData();
            formData.append("image", fileToUpload);
            const res = await fetch("/api/ai-analyze", {
              method: "POST",
              body: formData,
            });
            if (!res.ok) throw new Error("AI analysis failed");
            return (await res.json()) as AIAnalysis;
          } catch {
            return null;
          }
        })();

        const [imageUrl, aiResult] = await Promise.all([
          uploadPromise,
          aiPromise,
        ]);

        setUploadedImageUrl(imageUrl);

        if (aiResult) {
          setAiAnalysis(aiResult);
          populateFromAI(aiResult);
        } else {
          setAiFailed(true);
          toast("AI analysis unavailable. Please fill in details manually.", {
            icon: "\u2139\uFE0F",
          });
        }

        setStep("edit");
      } catch (err) {
        console.error("Upload/analysis failed:", err);
        toast.error("Failed to upload image. Please try again.");
        setStep("select");
      }
    },
    [user, populateFromAI]
  );

  // ─── Tag management ──────────────────────────────────────────────────────

  const addTag = useCallback(() => {
    const cleaned = tagInput.trim().toLowerCase();
    if (!cleaned) return;
    if (tags.length >= 25) {
      toast.error("Maximum 25 tags allowed.");
      return;
    }
    if (tags.includes(cleaned)) {
      toast.error("Tag already added.");
      return;
    }
    setTags((prev) => [...prev, cleaned]);
    setTagInput("");
  }, [tagInput, tags]);

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    if (!category) {
      toast.error("Please select a category.");
      return;
    }
    if (!priceNPR || priceNPR < 10 || priceNPR > 50000) {
      toast.error("Price must be between NPR 10 and 50,000.");
      return;
    }
    if (!uploadedImageUrl) {
      toast.error("Image upload not complete. Please try again.");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to upload.");
      return;
    }

    setStep("uploading");

    const qualityScore = aiAnalysis?.qualityScore ?? null;
    const marketDemand = aiAnalysis?.marketDemand ?? null;
    const isMarketable = aiAnalysis?.isMarketable ?? null;
    const rejectionReason = aiAnalysis?.rejectionReason ?? null;

    try {
      await addDoc(collection(db, "photos"), {
        // App source identifier (shared DB with WildSaura portfolio)
        source: "market",

        // Owner info
        ownerId: user.uid,
        ownerName: profile?.displayName || user.displayName || "Unknown",
        ownerAvatar: profile?.avatarUrl || user.photoURL || "",

        // Image
        imageUrl: uploadedImageUrl,
        thumbnailUrl: uploadedImageUrl,

        // Basic info
        title: title.trim(),
        description: description.trim(),
        tags,
        category,
        priceNPR,

        // Photographer
        photographerName: photographerName.trim(),
        portfolioUrl: portfolioUrl.trim(),
        copyrightNotice: copyrightNotice.trim(),

        // Location
        location: locationName.trim(),
        country: country.trim(),
        gpsCoordinates:
          gpsLat != null && gpsLng != null
            ? { lat: gpsLat, lng: gpsLng }
            : null,

        // Camera & Technical
        camera: camera.trim(),
        lens: lens.trim(),
        focalLength: focalLength.trim(),
        aperture: aperture.trim(),
        shutterSpeed: shutterSpeed.trim(),
        iso: iso.trim(),
        dateTaken: dateTaken || null,
        whiteBalance: whiteBalance.trim(),
        colorSpace: colorSpace.trim(),
        software: software.trim(),
        width: imageWidth || null,
        height: imageHeight || null,
        fileSize: fileSize || null,

        // Licensing
        licenseType,
        modelRelease,
        propertyRelease,
        usageNotes: usageNotes.trim(),

        // AI Data
        qualityScore,
        aiQualityScore: qualityScore,
        marketDemand,
        aiRejected: isMarketable === false,
        aiRejectionReason: rejectionReason,

        // Status
        status: isMarketable === false ? "appeal" : "pending",
        isPublic: false,
        salesCount: 0,
        viewCount: 0,
        downloadCount: 0,

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setStep("done");
      toast.success("Photo submitted successfully!");
    } catch (err) {
      console.error("Submit failed:", err);
      toast.error("Failed to submit photo. Please try again.");
      setStep("edit");
    }
  };

  // ─── Reset ────────────────────────────────────────────────────────────────

  const resetAll = () => {
    setStep("select");
    setSelectedFile(null);
    setPreviewUrl("");
    setImageWidth(null);
    setImageHeight(null);
    setFileSize(null);
    setUploadedImageUrl("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setSelectedAspect(undefined);
    setShowCropModal(false);
    setExifData({});
    setAiAnalysis(null);
    setAiFailed(false);
    setTitle("");
    setDescription("");
    setCategory("");
    setPriceNPR(100);
    setPhotographerName(profile?.displayName || "");
    setPortfolioUrl(profile?.website || "");
    setCopyrightNotice(
      `\u00A9 ${new Date().getFullYear()} ${profile?.displayName || ""}`
    );
    setLocationName("");
    setCountry("");
    setGpsLat(null);
    setGpsLng(null);
    setCamera("");
    setLens("");
    setFocalLength("");
    setAperture("");
    setShutterSpeed("");
    setIso("");
    setDateTaken("");
    setWhiteBalance("");
    setColorSpace("");
    setSoftware("");
    setLicenseType("Standard");
    setModelRelease("Not Required");
    setPropertyRelease("Not Required");
    setUsageNotes("");
    setTags([]);
    setTagInput("");
  };

  // ─── Loading / Auth / Verification guard ───────────────────────────────────

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Login Required
          </h2>
          <p className="text-gray-500">
            Please log in to upload photos to WildSaura Market.
          </p>
        </div>
      </div>
    );
  }

  // ─── Verification guard ───────────────────────────────────────────────────

  if (!isVerified) {
    const isPending = verificationStatus === "pending";
    const IDENTITY_URL =
      process.env.NEXT_PUBLIC_IDENTITY_APP_URL || "https://identity.wildsaura.com";
    const MARKET_URL =
      process.env.NEXT_PUBLIC_MARKET_URL || "https://market.wildsaura.com";
    const verifyHref = `${IDENTITY_URL}/verify?return=${encodeURIComponent(
      `${MARKET_URL}/upload`
    )}`;

    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md w-full">
          {isPending ? (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Verification Under Review
              </h2>
              <p className="text-gray-500 mb-6 text-sm">
                Your identity verification request has been submitted and is currently being reviewed by the WildSaura team. You will be able to upload and sell photos once your account is approved.
              </p>
              <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-700 font-medium">
                ⏳ Usually reviewed within 24–48 hours
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Account Verification Required
              </h2>
              <p className="text-gray-500 mb-6 text-sm">
                Your account needs to be verified before you can upload and sell photos on WildSaura Market.
                {verificationStatus === "rejected" && (
                  <span className="block mt-2 text-red-500 font-medium">
                    Your previous verification was not approved. Please re-submit with correct documents.
                  </span>
                )}
              </p>
              <a
                href={verifyHref}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
              >
                Complete Verification →
              </a>
              <p className="text-xs text-gray-400 mt-3">
                You&apos;ll be redirected to WildSaura Identity and automatically brought back here after verification.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Step: Select ─────────────────────────────────────────────────────────

  if (step === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
              <Upload className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Upload Your Photo
            </h1>
            <p className="text-gray-500">
              Share your best shots with the WildSaura Market community
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDropHandler}
            onClick={() => fileInputRef.current?.click()}
            className={`relative bg-white rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? "border-emerald-500 bg-emerald-50 scale-[1.02]"
                : "border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  isDragOver ? "bg-emerald-100" : "bg-gray-100"
                }`}
              >
                <ImageIcon
                  className={`w-8 h-8 ${
                    isDragOver ? "text-emerald-600" : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  {isDragOver
                    ? "Drop your photo here"
                    : "Drag & drop your photo here"}
                </p>
                <p className="text-sm text-gray-400">
                  or click to browse \u2022 JPG, PNG, WebP \u2022 Max 15 MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Crop Modal ───────────────────────────────────────────────────────────

  const cropModal = showCropModal && previewUrl && (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <h2 className="text-white font-semibold text-lg flex items-center gap-2">
          <Crop className="w-5 h-5" />
          Crop Image
        </h2>
        <button
          onClick={handleSkipCrop}
          className="text-white/70 hover:text-white text-sm flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          Skip
        </button>
      </div>

      {/* Cropper */}
      <div className="relative flex-1">
        <Cropper
          image={previewUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={selectedAspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Controls */}
      <div className="bg-black/60 backdrop-blur-sm px-4 py-4 space-y-4">
        {/* Aspect Ratio Buttons */}
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar.label}
              onClick={() => setSelectedAspect(ar.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedAspect === ar.value
                  ? "bg-emerald-600 text-white"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              {ar.label}
            </button>
          ))}
        </div>

        {/* Zoom + Rotation sliders */}
        <div className="flex items-center gap-6 max-w-lg mx-auto">
          <div className="flex-1 flex items-center gap-2">
            <ZoomIn className="w-4 h-4 text-white/70 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-emerald-500"
            />
          </div>
          <div className="flex-1 flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-white/70 shrink-0" />
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1 accent-emerald-500"
            />
            <span className="text-xs text-white/50 w-8 text-right">
              {rotation}\u00B0
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleSkipCrop}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white/80 bg-white/10 hover:bg-white/20 transition-colors"
          >
            Skip Cropping
          </button>
          <button
            onClick={handleApplyCrop}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Step: Analyzing ──────────────────────────────────────────────────────

  if (step === "analyzing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        {cropModal}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md w-full">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Analyzing Your Photo
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Uploading to cloud storage, running AI quality analysis, and
            extracting camera data...
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> Uploading
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Analysis
            </span>
            <span className="flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" /> EXIF Data
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step: Uploading ──────────────────────────────────────────────────────

  if (step === "uploading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md w-full">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Submitting Your Photo
          </h2>
          <p className="text-gray-500 text-sm">
            Saving all details to the database...
          </p>
        </div>
      </div>
    );
  }

  // ─── Step: Done ───────────────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Photo Submitted!
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Your photo has been submitted for review. Our team will review it
            shortly and it will go live once approved.
          </p>
          <button
            onClick={resetAll}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload Another Photo
          </button>
        </div>
      </div>
    );
  }

  // ─── Step: Edit (main form) ───────────────────────────────────────────────

  const qualityScore = aiAnalysis?.qualityScore ?? null;
  const marketDemand = aiAnalysis?.marketDemand ?? null;
  const isMarketable = aiAnalysis?.isMarketable ?? null;
  const rejectionReason = aiAnalysis?.rejectionReason ?? null;

  const qualityColor =
    qualityScore !== null
      ? qualityScore >= 8
        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
        : qualityScore >= 6
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-red-600 bg-red-50 border-red-200"
      : "text-gray-400 bg-gray-50 border-gray-200";

  const qualityBarColor =
    qualityScore !== null
      ? qualityScore >= 8
        ? "bg-emerald-500"
        : qualityScore >= 6
        ? "bg-amber-500"
        : "bg-red-500"
      : "bg-gray-300";

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {cropModal}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={resetAll}
            className="p-2 rounded-xl hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Photo Details
            </h1>
            <p className="text-sm text-gray-500">
              Review and complete all details before submission
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* ─── Image Preview ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative aspect-[16/9] bg-gray-900">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              )}
              {/* Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                {imageWidth && imageHeight && (
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                    {imageWidth} \u00D7 {imageHeight}
                  </span>
                )}
                {fileSize && (
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                    {formatFileSize(fileSize)}
                  </span>
                )}
              </div>
              {/* Action Buttons */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowCropModal(true);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                    setRotation(0);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/80 transition-colors flex items-center gap-1.5"
                >
                  <Crop className="w-3.5 h-3.5" />
                  Crop
                </button>
                <button
                  onClick={resetAll}
                  className="px-3 py-1.5 rounded-lg bg-red-500/80 backdrop-blur-sm text-white text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* ─── AI Analysis Section ───────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">AI Analysis</h3>
            </div>

            {aiFailed ? (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    AI analysis unavailable
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Please fill in all details manually. Your photo will still
                    be reviewed by our team.
                  </p>
                </div>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-3">
                {/* Quality Score */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-600">
                        Quality Score
                      </span>
                      <span
                        className={`text-sm font-bold px-2 py-0.5 rounded-md border ${qualityColor}`}
                      >
                        {qualityScore}/10
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${qualityBarColor}`}
                        style={{
                          width: `${(qualityScore ?? 0) * 10}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Market Demand + Marketability */}
                <div className="flex flex-wrap items-center gap-2">
                  {marketDemand && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {marketDemand} demand
                    </span>
                  )}
                  {isMarketable !== null && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                        isMarketable
                          ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                          : "bg-red-50 border border-red-100 text-red-700"
                      }`}
                    >
                      {isMarketable ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      {isMarketable ? "Approved for market" : "Needs improvement"}
                    </span>
                  )}
                </div>

                {/* Rejection Reason */}
                {!isMarketable && rejectionReason && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{rejectionReason}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </div>
            )}
          </div>

          {/* ─── Basic Information ──────────────────────────────────── */}
          <CollapsibleSection
            icon={<FileText className="w-5 h-5" />}
            title="Basic Information"
            subtitle={title ? `"${title.substring(0, 30)}${title.length > 30 ? "..." : ""}"` : "Required fields"}
            expanded={expandedSections.basic}
            onToggle={() => toggleSection("basic")}
          >
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="Give your photo a descriptive title"
                  className={INPUT_CLASS}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {title.length}/100
                </p>
              </div>

              <div>
                <label className={LABEL_CLASS}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Describe the scene, story, or context behind this photo..."
                  className={INPUT_CLASS + " resize-none"}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {description.length}/1000
                </p>
              </div>

              <div>
                <label className={LABEL_CLASS}>Category</label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as PhotoCategory)
                  }
                  className={INPUT_CLASS}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label} \u2014 {cat.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  Price (NPR) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={priceNPR}
                  onChange={(e) => setPriceNPR(Number(e.target.value))}
                  min={10}
                  max={50000}
                  placeholder="100"
                  className={INPUT_CLASS}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Set between NPR 10 \u2013 50,000
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* ─── Photographer Details ──────────────────────────────── */}
          <CollapsibleSection
            icon={<User className="w-5 h-5" />}
            title="Photographer Details"
            subtitle={photographerName || undefined}
            expanded={expandedSections.photographer}
            onToggle={() => toggleSection("photographer")}
          >
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Photographer Name</label>
                <input
                  type="text"
                  value={photographerName}
                  onChange={(e) => setPhotographerName(e.target.value)}
                  placeholder="Your name"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Portfolio / Website URL</label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Copyright Notice</label>
                <input
                  type="text"
                  value={copyrightNotice}
                  onChange={(e) => setCopyrightNotice(e.target.value)}
                  placeholder={`\u00A9 ${new Date().getFullYear()} Your Name`}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* ─── Location ──────────────────────────────────────────── */}
          <CollapsibleSection
            icon={<MapPin className="w-5 h-5" />}
            title="Location"
            subtitle={
              locationName
                ? `${locationName}${country ? `, ${country}` : ""}`
                : undefined
            }
            expanded={expandedSections.location}
            onToggle={() => toggleSection("location")}
          >
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Location Name</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Annapurna Base Camp"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Nepal"
                  className={INPUT_CLASS}
                />
              </div>
              {gpsLat != null && gpsLng != null && (
                <p className="text-xs text-gray-400">
                  GPS: {gpsLat.toFixed(6)}, {gpsLng.toFixed(6)}
                </p>
              )}
            </div>
          </CollapsibleSection>

          {/* ─── Camera & Technical ────────────────────────────────── */}
          <CollapsibleSection
            icon={<Settings2 className="w-5 h-5" />}
            title="Camera & Technical"
            subtitle={camera || undefined}
            expanded={expandedSections.camera}
            onToggle={() => toggleSection("camera")}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Camera</label>
                  <input type="text" value={camera} onChange={(e) => setCamera(e.target.value)} placeholder="Camera model" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Lens</label>
                  <input type="text" value={lens} onChange={(e) => setLens(e.target.value)} placeholder="Lens model" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Focal Length</label>
                  <input type="text" value={focalLength} onChange={(e) => setFocalLength(e.target.value)} placeholder="e.g. 50mm" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Aperture</label>
                  <input type="text" value={aperture} onChange={(e) => setAperture(e.target.value)} placeholder="e.g. f/2.8" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Shutter Speed</label>
                  <input type="text" value={shutterSpeed} onChange={(e) => setShutterSpeed(e.target.value)} placeholder="e.g. 1/250s" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>ISO</label>
                  <input type="text" value={iso} onChange={(e) => setIso(e.target.value)} placeholder="e.g. 400" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Date Taken</label>
                  <input type="date" value={dateTaken} onChange={(e) => setDateTaken(e.target.value)} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>White Balance</label>
                  <input type="text" value={whiteBalance} onChange={(e) => setWhiteBalance(e.target.value)} placeholder="e.g. Auto" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Color Space</label>
                  <input type="text" value={colorSpace} onChange={(e) => setColorSpace(e.target.value)} placeholder="e.g. sRGB" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Software</label>
                  <input type="text" value={software} onChange={(e) => setSoftware(e.target.value)} placeholder="e.g. Lightroom" className={INPUT_CLASS} />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* ─── Licensing ─────────────────────────────────────────── */}
          <CollapsibleSection
            icon={<Scale className="w-5 h-5" />}
            title="Licensing"
            subtitle={licenseType}
            expanded={expandedSections.licensing}
            onToggle={() => toggleSection("licensing")}
          >
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>License Type</label>
                <select value={licenseType} onChange={(e) => setLicenseType(e.target.value)} className={INPUT_CLASS}>
                  <option value="Standard">Standard</option>
                  <option value="Extended">Extended</option>
                  <option value="Editorial">Editorial Only</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Model Release</label>
                  <select value={modelRelease} onChange={(e) => setModelRelease(e.target.value)} className={INPUT_CLASS}>
                    <option value="Not Required">Not Required</option>
                    <option value="Yes">Yes, on file</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Property Release</label>
                  <select value={propertyRelease} onChange={(e) => setPropertyRelease(e.target.value)} className={INPUT_CLASS}>
                    <option value="Not Required">Not Required</option>
                    <option value="Yes">Yes, on file</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Usage Notes</label>
                <textarea value={usageNotes} onChange={(e) => setUsageNotes(e.target.value)} rows={2} placeholder="Any restrictions or usage guidelines..." className={INPUT_CLASS + " resize-none"} />
              </div>
            </div>
          </CollapsibleSection>

          {/* ─── Tags ──────────────────────────────────────────────── */}
          <CollapsibleSection
            icon={<Tag className="w-5 h-5" />}
            title="Tags"
            subtitle={tags.length > 0 ? `${tags.length} tag${tags.length === 1 ? "" : "s"}` : undefined}
            expanded={expandedSections.tags}
            onToggle={() => toggleSection("tags")}
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className={INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400">
                {tags.length}/25 tags \u2022 Press Enter or click + to add
              </p>
            </div>
          </CollapsibleSection>

          {/* ─── Submit Button ─────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={resetAll}
              className="px-6 py-3 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Start Over
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-8 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Send className="w-4 h-4" />
              Submit Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
