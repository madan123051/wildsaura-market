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

export function SalesTab(props: AdminTabProps) {
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
            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      NPR {totalSalesAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Purchases</p>
                    <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Toggle */}
            <div className="bg-white rounded-xl shadow-card p-5 border border-surface-border mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by buyer, seller, photo, payment method…"
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setSalesView("purchases")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      salesView === "purchases"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Purchases
                  </button>
                  <button
                    onClick={() => setSalesView("orders")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      salesView === "orders"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Orders
                  </button>
                </div>
                <button
                  onClick={fetchSales}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <RefreshCw className={`w-4 h-4 ${salesLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Purchases Table */}
            {salesView === "purchases" && (
              <div className="bg-white rounded-xl shadow-card border border-surface-border overflow-hidden">
                {salesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                  </div>
                ) : filteredPurchases.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No purchases found</p>
                    <p className="text-sm mt-1">No purchase records to display.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-surface-border">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">
                            <Hash className="w-4 h-4 inline mr-1" />ID
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Photo</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Buyer</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Seller</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Amount</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Payment</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {filteredPurchases.map((p: any) => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-400 font-mono">
                                {p.id.slice(0, 8)}…
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                {p.photoTitle || p.photoId?.slice(0, 12) || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-700">
                                {p.buyerEmail || p.buyerId?.slice(0, 12) || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-700">
                                {p.sellerName || p.sellerId?.slice(0, 12) || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-bold text-emerald-700">
                                NPR {(p.amountNPR || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                <CreditCard className="w-3 h-3" />
                                {p.paymentMethod || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(
                                  p.status || "completed"
                                )}`}
                              >
                                {p.status || "completed"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {formatDateTime(p.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end">
                                <button
                                  onClick={() => deletePurchase(p.id)}
                                  className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                  title="Delete purchase"
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
            )}

            {/* Orders Table */}
            {salesView === "orders" && (
              <div className="bg-white rounded-xl shadow-card border border-surface-border overflow-hidden">
                {salesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <Receipt className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No orders found</p>
                    <p className="text-sm mt-1">No order records to display.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-surface-border">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Order ID</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Buyer</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Items</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Total</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Payment</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {filteredOrders.map((o: any) => (
                          <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-400 font-mono">
                                {o.id.slice(0, 8)}…
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700 text-sm">
                              {o.buyerEmail || o.buyerId?.slice(0, 12) || "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-700 text-sm">
                              {o.items?.length || 0} item(s)
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-bold text-emerald-700">
                                NPR {(o.totalNPR || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                <CreditCard className="w-3 h-3" />
                                {o.paymentMethod || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(
                                  o.status
                                )}`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {formatDateTime(o.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setViewOrder(o)}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                  title="View order"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteOrder(o.id)}
                                  className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                  title="Delete order"
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
            )}

            {/* Order Detail Modal */}
            {viewOrder && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={() => setViewOrder(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
                      <button
                        onClick={() => setViewOrder(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-gray-400">Order ID</span>
                          <p className="font-mono text-gray-900 text-xs">{viewOrder.id}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Buyer</span>
                          <p className="font-medium text-gray-900">{viewOrder.buyerEmail}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Total</span>
                          <p className="font-bold text-emerald-700 text-lg">
                            NPR {(viewOrder.totalNPR || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Payment</span>
                          <p className="font-medium text-gray-900 capitalize">
                            {viewOrder.paymentMethod}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Status</span>
                          <p>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(
                                viewOrder.status
                              )}`}
                            >
                              {viewOrder.status}
                            </span>
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Date</span>
                          <p className="font-medium text-gray-900">
                            {formatDateTime(viewOrder.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <span className="text-gray-400 block mb-2">
                          Items ({viewOrder.items?.length || 0})
                        </span>
                        <div className="space-y-2">
                          {(viewOrder.items || []).map((item: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative">
                                {item.thumbnailUrl ? (
                                  <Image
                                    src={item.thumbnailUrl}
                                    alt={item.title || "Photo"}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {item.title || "Untitled"}
                                </p>
                              </div>
                              <span className="font-bold text-gray-900">
                                NPR {(item.priceNPR || 0).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => {
                          deleteOrder(viewOrder.id);
                          setViewOrder(null);
                        }}
                        className="px-4 py-2 rounded-xl font-medium text-red-600 hover:bg-red-50 border border-red-200 text-sm flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Order
                      </button>
                      <button
                        onClick={() => setViewOrder(null)}
                        className="px-4 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 text-sm"
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







