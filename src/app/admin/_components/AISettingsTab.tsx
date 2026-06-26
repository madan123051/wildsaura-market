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

export function AISettingsTab(props: AdminTabProps) {
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-600" />
                  AI System Management
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Configure API keys, models & settings for all AI services
                </p>
              </div>
              <button
                onClick={saveAISettings}
                disabled={aiSettingsSaving || aiSettingsLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                {aiSettingsSaving ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save All Settings</>
                )}
              </button>
            </div>

            {aiSettings?.updatedAt && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                Last updated: {new Date(aiSettings.updatedAt).toLocaleString()} by {aiSettings.updatedBy || "Admin"}
              </div>
            )}

            {aiSettingsLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : aiSettings ? (
              <div className="grid gap-6">
                {/* Photo Analysis AI */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Camera className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{aiSettings.photoAnalysis?.label || "Photo Analysis AI"}</h3>
                        <p className="text-xs text-gray-500">{aiSettings.photoAnalysis?.description || "Analyzes uploaded photos"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateAIService("photoAnalysis", "enabled", !aiSettings.photoAnalysis?.enabled)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        aiSettings.photoAnalysis?.enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {aiSettings.photoAnalysis?.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {aiSettings.photoAnalysis?.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Provider</label>
                      <select
                        value={aiSettings.photoAnalysis?.provider || "gemini"}
                        onChange={(e) => updateAIService("photoAnalysis", "provider", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI GPT</option>
                        <option value="claude">Anthropic Claude</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Model</label>
                      <select
                        value={aiSettings.photoAnalysis?.model || "gemini-2.0-flash"}
                        onChange={(e) => updateAIService("photoAnalysis", "model", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Fast &amp; Efficient)</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro (Most Capable)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Fast &amp; Smart)</option>
                        <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Lightweight)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">API Key</label>
                      <div className="flex gap-2">
                        <input
                          type={showApiKeys["photoAnalysis"] ? "text" : "password"}
                          value={aiSettings.photoAnalysis?.apiKey || ""}
                          onChange={(e) => updateAIService("photoAnalysis", "apiKey", e.target.value)}
                          placeholder="Enter API key..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => toggleApiKeyVisibility("photoAnalysis")}
                          className="px-3 py-2 border border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          {showApiKeys["photoAnalysis"] ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => testApiKey("photoAnalysis")}
                          disabled={apiKeyTestStatus["photoAnalysis"] === "testing" || !aiSettings.photoAnalysis?.apiKey}
                          className={`px-3 py-2 border rounded-xl text-xs font-medium transition-all ${
                            apiKeyTestStatus["photoAnalysis"] === "valid"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : apiKeyTestStatus["photoAnalysis"] === "invalid"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : apiKeyTestStatus["photoAnalysis"] === "testing"
                              ? "border-blue-300 bg-blue-50 text-blue-600"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {apiKeyTestStatus["photoAnalysis"] === "testing" ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : apiKeyTestStatus["photoAnalysis"] === "valid" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : apiKeyTestStatus["photoAnalysis"] === "invalid" ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            "Test"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chatbot AI */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{aiSettings.chatbot?.label || "Market Chatbot AI"}</h3>
                        <p className="text-xs text-gray-500">{aiSettings.chatbot?.description || "Customer support chatbot"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateAIService("chatbot", "enabled", !aiSettings.chatbot?.enabled)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        aiSettings.chatbot?.enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {aiSettings.chatbot?.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {aiSettings.chatbot?.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Provider</label>
                      <select
                        value={aiSettings.chatbot?.provider || "gemini"}
                        onChange={(e) => updateAIService("chatbot", "provider", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI GPT</option>
                        <option value="claude">Anthropic Claude</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Model</label>
                      <select
                        value={aiSettings.chatbot?.model || "gemini-2.0-flash"}
                        onChange={(e) => updateAIService("chatbot", "model", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Fast &amp; Efficient)</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro (Most Capable)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Fast &amp; Smart)</option>
                        <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Lightweight)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">API Key</label>
                      <div className="flex gap-2">
                        <input
                          type={showApiKeys["chatbot"] ? "text" : "password"}
                          value={aiSettings.chatbot?.apiKey || ""}
                          onChange={(e) => updateAIService("chatbot", "apiKey", e.target.value)}
                          placeholder="Enter API key..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => toggleApiKeyVisibility("chatbot")}
                          className="px-3 py-2 border border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          {showApiKeys["chatbot"] ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => testApiKey("chatbot")}
                          disabled={apiKeyTestStatus["chatbot"] === "testing" || !aiSettings.chatbot?.apiKey}
                          className={`px-3 py-2 border rounded-xl text-xs font-medium transition-all ${
                            apiKeyTestStatus["chatbot"] === "valid"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : apiKeyTestStatus["chatbot"] === "invalid"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : apiKeyTestStatus["chatbot"] === "testing"
                              ? "border-blue-300 bg-blue-50 text-blue-600"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {apiKeyTestStatus["chatbot"] === "testing" ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : apiKeyTestStatus["chatbot"] === "valid" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : apiKeyTestStatus["chatbot"] === "invalid" ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            "Test"
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">System Prompt</label>
                      <textarea
                        value={aiSettings.chatbot?.systemPrompt || ""}
                        onChange={(e) => updateAIService("chatbot", "systemPrompt", e.target.value)}
                        placeholder="Instructions for the chatbot..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Moderation AI */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{aiSettings.contentModeration?.label || "Content Moderation AI"}</h3>
                        <p className="text-xs text-gray-500">{aiSettings.contentModeration?.description || "Auto-screens uploads"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateAIService("contentModeration", "enabled", !aiSettings.contentModeration?.enabled)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        aiSettings.contentModeration?.enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {aiSettings.contentModeration?.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {aiSettings.contentModeration?.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Provider</label>
                      <select
                        value={aiSettings.contentModeration?.provider || "gemini"}
                        onChange={(e) => updateAIService("contentModeration", "provider", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI GPT</option>
                        <option value="claude">Anthropic Claude</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Model</label>
                      <select
                        value={aiSettings.contentModeration?.model || "gemini-2.0-flash"}
                        onChange={(e) => updateAIService("contentModeration", "model", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Fast &amp; Efficient)</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro (Most Capable)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Fast &amp; Smart)</option>
                        <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Lightweight)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">API Key</label>
                      <div className="flex gap-2">
                        <input
                          type={showApiKeys["contentModeration"] ? "text" : "password"}
                          value={aiSettings.contentModeration?.apiKey || ""}
                          onChange={(e) => updateAIService("contentModeration", "apiKey", e.target.value)}
                          placeholder="Enter API key..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => toggleApiKeyVisibility("contentModeration")}
                          className="px-3 py-2 border border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          {showApiKeys["contentModeration"] ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => testApiKey("contentModeration")}
                          disabled={apiKeyTestStatus["contentModeration"] === "testing" || !aiSettings.contentModeration?.apiKey}
                          className={`px-3 py-2 border rounded-xl text-xs font-medium transition-all ${
                            apiKeyTestStatus["contentModeration"] === "valid"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : apiKeyTestStatus["contentModeration"] === "invalid"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : apiKeyTestStatus["contentModeration"] === "testing"
                              ? "border-blue-300 bg-blue-50 text-blue-600"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {apiKeyTestStatus["contentModeration"] === "testing" ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : apiKeyTestStatus["contentModeration"] === "valid" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : apiKeyTestStatus["contentModeration"] === "invalid" ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            "Test"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEO & Description AI */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{aiSettings.seoOptimization?.label || "SEO & Description AI"}</h3>
                        <p className="text-xs text-gray-500">{aiSettings.seoOptimization?.description || "Generates SEO-optimized content"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateAIService("seoOptimization", "enabled", !aiSettings.seoOptimization?.enabled)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        aiSettings.seoOptimization?.enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {aiSettings.seoOptimization?.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {aiSettings.seoOptimization?.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Provider</label>
                      <select
                        value={aiSettings.seoOptimization?.provider || "gemini"}
                        onChange={(e) => updateAIService("seoOptimization", "provider", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI GPT</option>
                        <option value="claude">Anthropic Claude</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Model</label>
                      <select
                        value={aiSettings.seoOptimization?.model || "gemini-2.0-flash"}
                        onChange={(e) => updateAIService("seoOptimization", "model", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Fast &amp; Efficient)</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro (Most Capable)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Fast &amp; Smart)</option>
                        <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Lightweight)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">API Key</label>
                      <div className="flex gap-2">
                        <input
                          type={showApiKeys["seoOptimization"] ? "text" : "password"}
                          value={aiSettings.seoOptimization?.apiKey || ""}
                          onChange={(e) => updateAIService("seoOptimization", "apiKey", e.target.value)}
                          placeholder="Enter API key..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => toggleApiKeyVisibility("seoOptimization")}
                          className="px-3 py-2 border border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          {showApiKeys["seoOptimization"] ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => testApiKey("seoOptimization")}
                          disabled={apiKeyTestStatus["seoOptimization"] === "testing" || !aiSettings.seoOptimization?.apiKey}
                          className={`px-3 py-2 border rounded-xl text-xs font-medium transition-all ${
                            apiKeyTestStatus["seoOptimization"] === "valid"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : apiKeyTestStatus["seoOptimization"] === "invalid"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : apiKeyTestStatus["seoOptimization"] === "testing"
                              ? "border-blue-300 bg-blue-50 text-blue-600"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {apiKeyTestStatus["seoOptimization"] === "testing" ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : apiKeyTestStatus["seoOptimization"] === "valid" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : apiKeyTestStatus["seoOptimization"] === "invalid" ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            "Test"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">How API keys work</p>
                    <ul className="mt-1 space-y-1 text-blue-700">
                      <li>• API keys are stored securely in Firestore and used server-side only</li>
                      <li>• If no key is set here, the system falls back to environment variables</li>
                      <li>• You can change the AI provider and model without redeploying</li>
                      <li>• Disable a service to turn it off without deleting the key</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>Could not load AI settings. Try refreshing.</p>
              </div>
            )}
          </div>
  );
}







