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

export function ListingsTab(props: AdminTabProps) {
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
            {/* Search bar */}
            <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border mb-6">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search listings by title, photographer, or category…"
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={fetchListings}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <RefreshCw className={`w-4 h-4 ${listingsLoading ? "animate-spin" : ""}`} />
                </button>
                <span className="text-sm text-gray-400">{filteredListings.length} listing(s)</span>
              </div>
            </div>

            {/* Listings table */}
            <div className="bg-white rounded-xl shadow-card border border-surface-border overflow-hidden">
              {listingsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No listings found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-surface-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Photo</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Owner</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Price</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Public</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Sales</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {filteredListings.map((listing: any) => (
                        <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                                {listing.thumbnailUrl || listing.imageUrl ? (
                                  <Image
                                    src={listing.thumbnailUrl || listing.imageUrl}
                                    alt={listing.title || "Photo"}
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
                                <p className="font-medium text-gray-900 truncate max-w-[180px]">
                                  {listing.title || "Untitled"}
                                </p>
                                <p className="text-xs text-gray-400">{formatDate(listing.createdAt)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-sm">
                            {listing.ownerName || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-sm capitalize">
                            {listing.category || "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-medium text-sm">
                            NPR {listing.priceNPR ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(
                                listing.status
                              )}`}
                            >
                              {listing.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-medium ${
                                listing.isPublic !== false
                                  ? "text-emerald-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {listing.isPublic !== false ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 text-sm">
                            {listing.salesCount ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(listing)}
                                className="p-1.5 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50"
                                title="Edit listing"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteListing(listing.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                                title="Delete listing"
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

            {/* Edit Listing Modal */}
            {editListing && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={() => setEditListing(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Edit Listing</h3>
                      <button
                        onClick={() => setEditListing(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Photo cannot be changed</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          Only listing metadata can be edited. The photo image itself cannot be replaced.
                        </p>
                      </div>
                    </div>

                    {/* Thumbnail preview */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                        {editListing.thumbnailUrl || editListing.imageUrl ? (
                          <Image
                            src={editListing.thumbnailUrl || editListing.imageUrl}
                            alt={editListing.title || "Photo"}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>By {editListing.ownerName || "Unknown"}</p>
                        <p className="text-xs">{formatDate(editListing.createdAt)}</p>
                      </div>
                    </div>

                    {/* Form fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm((f: any) => ({ ...f, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm((f: any) => ({ ...f, description: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price (NPR)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={editForm.priceNPR}
                            onChange={(e) =>
                              setEditForm((f: any) => ({
                                ...f,
                                priceNPR: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm((f: any) => ({ ...f, category: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="">Select category</option>
                            {CATEGORIES.map((cat: any) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tags (comma separated)
                        </label>
                        <input
                          type="text"
                          value={editForm.tags}
                          onChange={(e) => setEditForm((f: any) => ({ ...f, tags: e.target.value }))}
                          placeholder="nature, mountain, sunset"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm((f: any) => ({
                                ...f,
                                status: e.target.value as "pending" | "approved" | "rejected",
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Visibility
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((f: any) => ({ ...f, isPublic: !f.isPublic }))
                            }
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                              editForm.isPublic
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-gray-50 border-gray-200 text-gray-500"
                            }`}
                          >
                            {editForm.isPublic ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                            {editForm.isPublic ? "Public" : "Private"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={saveListingEdit}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 flex items-center gap-1.5 text-sm"
                      >
                        <Save className="w-4 h-4" /> Save Changes
                      </button>
                      <button
                        onClick={() => setEditListing(null)}
                        className="px-4 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 text-sm ml-auto"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
  );
}







