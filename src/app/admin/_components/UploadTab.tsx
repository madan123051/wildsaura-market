import Image from "next/image";
import { CATEGORIES } from "@/types";
import type { PhotoCategory } from "@/types";
import type { PhotoFilter } from "./shared";
import { formatDate, formatDateTime, roleBadge, statusBadge } from "./shared";
import {
  Shield,
  Camera,
  Users,
  ListChecks,
  BarChart3,
  Check,
  X,
  Eye,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  AlertTriangle,
  Star,
  TrendingUp,
  DollarSign,
  ImageIcon,
  UserCheck,
  Package,
  RefreshCw,
  CheckSquare,
  Square,
  Filter,
  ToggleLeft,
  ToggleRight,
  Save,
  Info,
  AlertCircle,
  ShoppingCart,
  CreditCard,
  UserX,
  Mail,
  Calendar,
  ArrowUpRight,
  Hash,
  Receipt,
  Settings,
  Key,
  Cpu,
  Zap,
  Bot,
  MessageSquare,
  Eye as EyeIcon,
  EyeOff,
  Globe,
  FileText,
  ShieldCheck,
  Upload,
  Loader2,
  CheckCircle,
} from "lucide-react";

type AdminTabProps = Record<string, any>;

export function UploadTab(props: AdminTabProps) {
  const {
    setActiveTab,
    statsLoading,
    stats,
    fetchStats,
    photoFilter,
    setPhotoFilter,
    selectedPhotoIds,
    bulkUpdateStatus,
    photos,
    photosLoading,
    fetchPhotos,
    toggleSelectAll,
    toggleSelectPhoto,
    previewPhoto,
    setPreviewPhoto,
    updatePhotoStatus,
    deletePhoto,
    userSearch,
    setUserSearch,
    fetchUsers,
    filteredUsers,
    usersLoading,
    viewUser,
    setViewUser,
    changeUserRole,
    toggleVerified,
    deleteUser,
    listingSearch,
    setListingSearch,
    fetchListings,
    filteredListings,
    listingsLoading,
    openEditModal,
    deleteListing,
    editListing,
    setEditListing,
    editForm,
    setEditForm,
    saveListingEdit,
    totalSalesAmount,
    orders,
    purchases,
    salesSearch,
    setSalesSearch,
    salesView,
    setSalesView,
    fetchSales,
    salesLoading,
    filteredPurchases,
    filteredOrders,
    deletePurchase,
    deleteOrder,
    viewOrder,
    setViewOrder,
    aiSettings,
    aiSettingsLoading,
    aiSettingsSaving,
    testingService,
    apiKeyVisible,
    apiKeyTestStatus,
    showApiKeys,
    updateAIService,
    toggleApiKeyVisibility,
    testApiKey,
    saveAISettings,
    uploadFileRef,
    handleAdminFileSelect,
    uploadStep,
    uploadPreview,
    uploadAiError,
    uploadPhotographerName,
    setUploadPhotographerName,
    uploadTitle,
    setUploadTitle,
    uploadDescription,
    setUploadDescription,
    uploadTags,
    uploadTagInput,
    setUploadTagInput,
    handleAdminAddTag,
    setUploadTags,
    uploadCategory,
    setUploadCategory,
    uploadPrice,
    setUploadPrice,
    uploadCamera,
    setUploadCamera,
    uploadLens,
    setUploadLens,
    uploadFocalLength,
    setUploadFocalLength,
    uploadAperture,
    setUploadAperture,
    uploadShutterSpeed,
    setUploadShutterSpeed,
    uploadIso,
    setUploadIso,
    uploadLocation,
    setUploadLocation,
    uploadCountry,
    setUploadCountry,
    uploadLicenseType,
    setUploadLicenseType,
    handleAdminUploadSubmit,
    handleAdminUploadReset,
  } = props;

  return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Admin Upload</h2>
                  <p className="text-sm text-gray-500">Upload photos directly — auto-approved & published instantly</p>
                </div>
              </div>

              {/* Step: Select File */}
              {uploadStep === "select" && (
                <div
                  onClick={() => uploadFileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                >
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Click to select a photo</h3>
                  <p className="text-sm text-gray-500">JPG, PNG, WebP — Max 100MB</p>
                  <input
                    ref={uploadFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAdminFileSelect}
                  />
                </div>
              )}

              {/* Step: Analyzing */}
              {uploadStep === "analyzing" && (
                <div className="text-center py-16">
                  {uploadPreview && (
                    <div className="w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden shadow-lg">
                      <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Uploading & analyzing with AI...</p>
                </div>
              )}

              {/* Step: Edit Details */}
              {uploadStep === "edit" && (
                <div className="space-y-6">
                  {/* Preview */}
                  <div className="flex gap-6">
                    {uploadPreview && (
                      <div className="w-64 h-64 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                        <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 space-y-4">
                      {uploadAiError && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {uploadAiError}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📸 Photographer Name</label>
                        <input
                          type="text"
                          value={uploadPhotographerName}
                          onChange={(e) => setUploadPhotographerName(e.target.value)}
                          placeholder="Photographer name (shown on listing)"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                          type="text"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          placeholder="Photo title..."
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={uploadDescription}
                          onChange={(e) => setUploadDescription(e.target.value)}
                          rows={3}
                          placeholder="Describe the photo..."
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={uploadTagInput}
                        onChange={(e) => setUploadTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdminAddTag())}
                        placeholder="Add tag..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAdminAddTag}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {uploadTags.map((tag: any) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                          {tag}
                          <button onClick={() => setUploadTags(uploadTags.filter((t: any) => t !== tag))} className="hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Category & Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        {CATEGORIES.map((cat: any) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR)</label>
                      <input
                        type="number"
                        value={uploadPrice}
                        onChange={(e) => setUploadPrice(Number(e.target.value))}
                        min={10}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Camera & Technical Details */}
                  <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Camera className="w-4 h-4 text-gray-500" />
                      <h3 className="text-sm font-semibold text-gray-700">Camera & Technical Details</h3>
                      <span className="text-xs text-gray-400">(optional)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Camera</label>
                        <input type="text" value={uploadCamera} onChange={(e) => setUploadCamera(e.target.value)} placeholder="e.g. Canon EOS R5" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Lens</label>
                        <input type="text" value={uploadLens} onChange={(e) => setUploadLens(e.target.value)} placeholder="e.g. RF 100-500mm" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Focal Length</label>
                        <input type="text" value={uploadFocalLength} onChange={(e) => setUploadFocalLength(e.target.value)} placeholder="e.g. 200mm" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Aperture</label>
                        <input type="text" value={uploadAperture} onChange={(e) => setUploadAperture(e.target.value)} placeholder="e.g. f/5.6" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Shutter Speed</label>
                        <input type="text" value={uploadShutterSpeed} onChange={(e) => setUploadShutterSpeed(e.target.value)} placeholder="e.g. 1/500s" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">ISO</label>
                        <input type="text" value={uploadIso} onChange={(e) => setUploadIso(e.target.value)} placeholder="e.g. 400" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                        <input type="text" value={uploadLocation} onChange={(e) => setUploadLocation(e.target.value)} placeholder="e.g. Chitwan National Park" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                        <input type="text" value={uploadCountry} onChange={(e) => setUploadCountry(e.target.value)} placeholder="e.g. Nepal" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">License Type</label>
                      <select value={uploadLicenseType} onChange={(e) => setUploadLicenseType(e.target.value as any)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white">
                        <option value="Standard">Standard — Commercial use, no exclusive rights</option>
                        <option value="Extended">Extended — Full commercial rights</option>
                        <option value="Editorial">Editorial — News/educational use only</option>
                      </select>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAdminUploadSubmit}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Publish Photo
                    </button>
                    <button
                      onClick={handleAdminUploadReset}
                      className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Uploading */}
              {uploadStep === "uploading" && (
                <div className="text-center py-16">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Publishing photo...</p>
                </div>
              )}

              {/* Step: Done */}
              {uploadStep === "done" && (
                <div className="text-center py-16">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Photo Published! \ud83c\udf89</h3>
                  <p className="text-gray-500 mb-6">Your photo is live and visible to all users.</p>
                  <button
                    onClick={handleAdminUploadReset}
                    className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    Upload Another
                  </button>
                </div>
              )}
            </div>
          </div>
  );
}








