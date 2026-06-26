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

export function PhotosTab(props: AdminTabProps) {
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
          <div>
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Filter:</span>
                  {(["pending", "appeal", "approved", "rejected", "all"] as PhotoFilter[]).map((f: any) => (
                    <button
                      key={f}
                      onClick={() => setPhotoFilter(f)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                        photoFilter === f
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => bulkUpdateStatus("approved")}
                    disabled={selectedPhotoIds.size === 0}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve ({selectedPhotoIds.size})
                  </button>
                  <button
                    onClick={() => bulkUpdateStatus("rejected")}
                    disabled={selectedPhotoIds.size === 0}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject ({selectedPhotoIds.size})
                  </button>
                  <button
                    onClick={fetchPhotos}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    <RefreshCw className={`w-4 h-4 ${photosLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-card border border-surface-border overflow-hidden">
              {photosLoading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <ImageIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No photos found</p>
                  <p className="text-sm mt-1">No {photoFilter !== "all" ? photoFilter : ""} photos to display.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-surface-border">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                            {selectedPhotoIds.size === photos.length ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Photo</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Photographer</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Price</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {photos.map((photo: any) => (
                        <tr key={photo.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleSelectPhoto(photo.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {selectedPhotoIds.has(photo.id) ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                                {photo.thumbnailUrl || photo.imageUrl ? (
                                  <Image
                                    src={photo.thumbnailUrl || photo.imageUrl}
                                    alt={photo.title || "Photo"}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-gray-300" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate max-w-[200px]">
                                  {photo.title || "Untitled"}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatDate(photo.createdAt)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {photo.ownerAvatar ? (
                                <Image
                                  src={photo.ownerAvatar}
                                  alt={photo.ownerName || "User"}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-emerald-700">
                                    {(photo.ownerName || "?")[0]?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="text-gray-700 text-sm">{photo.ownerName || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-600 text-sm capitalize">{photo.category || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-700 font-medium text-sm">NPR {photo.priceNPR ?? 0}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(
                                photo.status
                              )}`}
                            >
                              {photo.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                              {photo.status === "approved" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {photo.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                              {photo.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setPreviewPhoto(photo)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {photo.status !== "approved" && (
                                <button
                                  onClick={() => updatePhotoStatus(photo.id, "approved")}
                                  className="p-1.5 text-green-500 hover:text-green-700 rounded-lg hover:bg-green-50"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              {photo.status !== "rejected" && (
                                <button
                                  onClick={() => updatePhotoStatus(photo.id, "rejected")}
                                  className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deletePhoto(photo.id)}
                                className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Photo Preview Modal */}
            {previewPhoto && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={() => setPreviewPhoto(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">{previewPhoto.title || "Untitled"}</h3>
                      <button
                        onClick={() => setPreviewPhoto(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4">
                      {previewPhoto.imageUrl ? (
                        <Image
                          src={previewPhoto.imageUrl}
                          alt={previewPhoto.title || "Photo"}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 672px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Photographer</span>
                        <p className="font-medium text-gray-900">{previewPhoto.ownerName || "Unknown"}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Category</span>
                        <p className="font-medium text-gray-900 capitalize">{previewPhoto.category || "—"}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Price</span>
                        <p className="font-medium text-gray-900">NPR {previewPhoto.priceNPR ?? 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Status</span>
                        <p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(
                              previewPhoto.status
                            )}`}
                          >
                            {previewPhoto.status}
                          </span>
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">Description</span>
                        <p className="font-medium text-gray-900">{previewPhoto.description || "No description"}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">Tags</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(previewPhoto.tags || []).map((tag: any, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {(!previewPhoto.tags || previewPhoto.tags.length === 0) && (
                            <span className="text-gray-400 text-xs">No tags</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-lg font-bold text-gray-900">{previewPhoto.viewCount ?? 0}</p>
                        <p className="text-xs text-gray-400">Views</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-lg font-bold text-gray-900">{previewPhoto.downloadCount ?? 0}</p>
                        <p className="text-xs text-gray-400">Downloads</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-lg font-bold text-gray-900">{previewPhoto.salesCount ?? 0}</p>
                        <p className="text-xs text-gray-400">Sales</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      {previewPhoto.status !== "approved" && (
                        <button
                          onClick={() => {
                            updatePhotoStatus(previewPhoto.id, "approved");
                            setPreviewPhoto(null);
                          }}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 flex items-center gap-1.5 text-sm"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                      )}
                      {previewPhoto.status !== "rejected" && (
                        <button
                          onClick={() => {
                            updatePhotoStatus(previewPhoto.id, "rejected");
                            setPreviewPhoto(null);
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 flex items-center gap-1.5 text-sm"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      )}
                      <button
                        onClick={() => {
                          deletePhoto(previewPhoto.id);
                          setPreviewPhoto(null);
                        }}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-medium hover:bg-red-200 flex items-center gap-1.5 text-sm"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                      <button
                        onClick={() => setPreviewPhoto(null)}
                        className="px-4 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 text-sm ml-auto"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
  );
}








