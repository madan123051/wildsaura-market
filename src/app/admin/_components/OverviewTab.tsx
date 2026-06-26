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

export function OverviewTab(props: AdminTabProps) {
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
            {statsLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Photos</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalPhotos}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          NPR {stats.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-purple-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Sales</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-pink-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photo Status Breakdown */}
                <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Photo Status Breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 text-center">
                      <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-800">{stats.pendingCount}</p>
                      <p className="text-xs text-yellow-600 font-medium">Pending</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 text-center">
                      <AlertCircle className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-orange-800">{stats.appealCount}</p>
                      <p className="text-xs text-orange-600 font-medium">Appeals</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-800">{stats.approvedCount}</p>
                      <p className="text-xs text-green-600 font-medium">Approved</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
                      <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-800">{stats.rejectedCount}</p>
                      <p className="text-xs text-red-600 font-medium">Rejected</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Purchases */}
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-gray-900">Recent Sales</h3>
                      <button
                        onClick={() => setActiveTab("sales")}
                        className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        View all <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                    {stats.recentPurchases.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">No sales yet</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.recentPurchases.map((p: any) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {p.photoTitle || p.photoId}
                              </p>
                              <p className="text-xs text-gray-400">
                                Buyer: {p.buyerEmail || p.buyerId} • {formatDate(p.createdAt)}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-emerald-700">
                              NPR {(p.amountNPR || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top Sellers */}
                  <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                    <h3 className="text-base font-bold text-gray-900 mb-4">Top Sellers</h3>
                    {stats.topSellers.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">No sellers yet</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.topSellers.map((s: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-emerald-700">
                                  #{i + 1}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                                <p className="text-xs text-gray-400">{s.sales} sales</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              NPR {s.revenue.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Categories */}
                <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Top Categories</h3>
                  {stats.categoryBreakdown.length === 0 ? (
                    <p className="text-sm text-gray-400">No categories to display</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.categoryBreakdown.slice(0, 10).map((cat: any) => {
                        const maxCount = stats.categoryBreakdown[0]?.count || 1;
                        const pct = Math.round((cat.count / maxCount) * 100);
                        return (
                          <div key={cat.category}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {cat.category}
                              </span>
                              <span className="text-sm text-gray-500">{cat.count} photos</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-emerald-500 h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Refresh */}
                <div className="flex justify-center">
                  <button
                    onClick={fetchStats}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 flex items-center gap-1.5 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh Stats
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Info className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Stats unavailable</p>
                <p className="text-sm mt-1">Could not load statistics.</p>
              </div>
            )}
          </div>
  );
}







