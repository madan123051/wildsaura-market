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

export function UsersTab(props: AdminTabProps) {
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
                    placeholder="Search users by name or email…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={fetchUsers}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <RefreshCw className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`} />
                </button>
                <span className="text-sm text-gray-400">{filteredUsers.length} user(s)</span>
              </div>
            </div>

            {/* Users table */}
            <div className="bg-white rounded-xl shadow-card border border-surface-border overflow-hidden">
              {usersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-surface-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">User</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Verified</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Photos</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Sales</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Joined</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {filteredUsers.map((user: any) => (
                        <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {user.avatarUrl ? (
                                <Image
                                  src={user.avatarUrl}
                                  alt={user.displayName || "User"}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-emerald-700">
                                    {(user.displayName || "?")[0]?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="font-medium text-gray-900">
                                {user.displayName || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{user.email || "—"}</td>
                          <td className="px-4 py-3">
                            <select
                              value={user.role}
                              onChange={(e) =>
                                changeUserRole(
                                  user.uid,
                                  e.target.value as "creator" | "buyer" | "admin"
                                )
                              }
                              className={`px-2 py-1 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${roleBadge(
                                user.role
                              )}`}
                            >
                              <option value="creator">Creator</option>
                              <option value="buyer">Buyer</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleVerified(user.uid, user.isVerified)}
                              className="flex items-center gap-1"
                              title={user.isVerified ? "Remove verification" : "Verify user"}
                            >
                              {user.isVerified ? (
                                <ToggleRight className="w-6 h-6 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-gray-300" />
                              )}
                              <span
                                className={`text-xs font-medium ${
                                  user.isVerified ? "text-emerald-600" : "text-gray-400"
                                }`}
                              >
                                {user.isVerified ? "Yes" : "No"}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{user.totalPhotos ?? 0}</td>
                          <td className="px-4 py-3 text-gray-700">{user.totalSales ?? 0}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setViewUser(user)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteUser(user.uid, user.displayName)}
                                className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="Delete user"
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

            {/* User Detail Modal */}
            {viewUser && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={() => setViewUser(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-900">User Details</h3>
                      <button
                        onClick={() => setViewUser(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      {viewUser.avatarUrl ? (
                        <Image
                          src={viewUser.avatarUrl}
                          alt={viewUser.displayName || "User"}
                          width={64}
                          height={64}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-emerald-700">
                            {(viewUser.displayName || "?")[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">
                          {viewUser.displayName || "Unknown"}
                        </h4>
                        <p className="text-sm text-gray-500">{viewUser.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${roleBadge(
                              viewUser.role
                            )}`}
                          >
                            {viewUser.role}
                          </span>
                          {viewUser.isVerified && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <UserCheck className="w-3 h-3 mr-1" /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">Total Photos</p>
                        <p className="text-lg font-bold text-gray-900">{viewUser.totalPhotos ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">Total Sales</p>
                        <p className="text-lg font-bold text-gray-900">{viewUser.totalSales ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">Wallet Points</p>
                        <p className="text-lg font-bold text-gray-900">{viewUser.walletPoints ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">Joined</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatDate(viewUser.createdAt)}
                        </p>
                      </div>
                    </div>
                    {viewUser.bio && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-400 mb-1">Bio</p>
                        <p className="text-sm text-gray-700">{viewUser.bio}</p>
                      </div>
                    )}
                    {viewUser.website && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1">Website</p>
                        <a
                          href={viewUser.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-600 hover:underline"
                        >
                          {viewUser.website}
                        </a>
                      </div>
                    )}
                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => {
                          deleteUser(viewUser.uid, viewUser.displayName);
                          setViewUser(null);
                        }}
                        className="px-4 py-2 rounded-xl font-medium text-red-600 hover:bg-red-50 border border-red-200 text-sm flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" /> Delete User
                      </button>
                      <button
                        onClick={() => setViewUser(null)}
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







