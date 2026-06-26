"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Download,
  LayoutDashboard,
  ShieldCheck,
  ImageIcon,
  Users,
  ShoppingBag,
  Package,
  Camera,
  Bell,
  Coins,
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, limit, query, updateDoc, where } from "firebase/firestore";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { clearSessionCookie } from "@/lib/session";
import type { UserProfile, CartItem } from "@/types";
import { CATEGORIES } from "@/types";

const ADMIN_EMAIL = "madan123050@gmail.com";

type UserNotification = {
  id: string;
  title: string;
  message: string;
  points?: number;
  read?: boolean;
  createdAt?: { seconds: number } | Date;
};

function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [scrolled, setScrolled] = useState(false);

  const categoriesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.email === ADMIN_EMAIL || profile?.role === "admin";
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setProfile({ uid: userDoc.id, ...userDoc.data() } as UserProfile);
          }
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
        setNotifications([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    async function fetchNotifications() {
      try {
        const snap = await getDocs(
          query(
            collection(db, "notifications"),
            where("userId", "==", user!.uid),
            limit(12)
          )
        );
        const items = snap.docs
          .map((notificationDoc) => ({
            id: notificationDoc.id,
            ...(notificationDoc.data() as Omit<UserNotification, "id">),
          }))
          .sort((a, b) => {
            const aTime = a.createdAt && "seconds" in a.createdAt ? a.createdAt.seconds : 0;
            const bTime = b.createdAt && "seconds" in b.createdAt ? b.createdAt.seconds : 0;
            return bTime - aTime;
          });
        if (!cancelled) setNotifications(items);
      } catch (error) {
        console.warn("Failed to load notifications", error);
      }
    }

    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user]);

  // Cart count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const raw = localStorage.getItem("wildsaura_cart");
        const cart: CartItem[] = raw ? JSON.parse(raw) : [];
        setCartCount(cart.length);
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener("cart-updated", updateCartCount);
    window.addEventListener("storage", updateCartCount);
    return () => {
      window.removeEventListener("cart-updated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setShowCategories(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery("");
      setShowMobileMenu(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearSessionCookie();
      setShowUserMenu(false);
      setShowMobileMenu(false);
      router.push("/");
    } catch {
      // silent fail
    }
  };

  const handleToggleNotifications = async () => {
    const nextOpen = !showNotifications;
    setShowNotifications(nextOpen);
    if (!nextOpen || unreadCount === 0) return;

    const unread = notifications.filter((notification) => !notification.read);
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
    await Promise.all(
      unread.map((notification) =>
        updateDoc(doc(db, "notifications", notification.id), { read: true }).catch(() => null)
      )
    );
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b transition-shadow duration-300 ${
        scrolled ? "shadow-md border-transparent" : "border-surface-border"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image src="/icon.png" alt="WildSaura Market" width={120} height={80} className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/explore"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
            >
              Explore
            </Link>

            {/* Categories Dropdown */}
            <div className="relative" ref={categoriesRef}>
              <button
                onClick={() => setShowCategories(!showCategories)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
              >
                Categories
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showCategories ? "rotate-180" : ""}`}
                />
              </button>
              {showCategories && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-surface-border py-2 z-50">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.value}
                      href={`/explore?category=${cat.value}`}
                      onClick={() => setShowCategories(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-primary/5 hover:text-brand-primary transition-colors"
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <div>
                        <p className="font-medium">{cat.label}</p>
                        <p className="text-xs text-gray-400">{cat.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Shopping Marketplace */}
            <Link
              href="/shopping"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Shopping
            </Link>

            <Link
              href="/community"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              Community
            </Link>

            <Link
              href="/upload"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              Sell Photo
            </Link>

            <Link
              href="/shopping/sell"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              Sell Equipment
            </Link>

            {/* Admin Panel button */}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-500 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-500 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-accent text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {user && (
              <div className="relative hidden md:block" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  className="relative p-2 text-gray-500 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-brand-accent text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-surface-border bg-white py-2 shadow-xl z-50">
                    <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
                      <p className="text-sm font-semibold text-brand-dark">Notifications</p>
                      <Link
                        href="/dashboard?tab=points"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs font-medium text-brand-primary hover:underline"
                      >
                        Points
                      </Link>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 text-sm ${
                              notification.read ? "bg-white" : "bg-emerald-50/70"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                <Coins className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900">{notification.title}</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                                  {notification.message}
                                </p>
                                {notification.points ? (
                                  <p className={`mt-1 text-xs font-semibold ${
                                    notification.points < 0 ? "text-red-700" : "text-emerald-700"
                                  }`}>
                                    {notification.points > 0 ? "+" : ""}{notification.points} points
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* User Menu / Login */}
            {user ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-brand-primary/10">
                    {profile?.avatarUrl ? (
                      <Image
                        src={profile.avatarUrl}
                        alt={profile.displayName || ""}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-4 h-4 text-brand-primary" />
                      </div>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-surface-border py-2 z-50">
                    <div className="px-4 py-3 border-b border-surface-border">
                      <p className="text-sm font-semibold text-brand-dark truncate">
                        {profile?.displayName || user.displayName || "User"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full">ADMIN</span>
                      )}
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard?tab=listings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />
                      My Photo Listings
                    </Link>
                    <Link
                      href="/dashboard?tab=equipment"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      My Equipment Listings
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      href="/downloads"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      My Downloads
                    </Link>
                    <Link
                      href="/dashboard?tab=points"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Coins className="w-4 h-4" />
                      Points & Rewards
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}

                    <div className="border-t border-surface-border mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex items-center gap-2 bg-brand-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-primary/90 transition-colors"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-500 hover:text-brand-primary rounded-lg transition-colors"
              aria-label="Menu"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="pb-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search photos by keyword, category..."
                className="w-full pl-12 pr-4 py-3 bg-surface-muted rounded-xl border border-surface-border text-sm text-brand-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-surface-border bg-white">
          <div className="px-4 py-4 space-y-1">
            <Link
              href="/explore"
              onClick={() => setShowMobileMenu(false)}
              className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-brand-primary/5 hover:text-brand-primary rounded-lg transition-colors"
            >
              Explore
            </Link>

            <Link
              href="/shopping"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-brand-primary/5 hover:text-brand-primary rounded-lg transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Shop Equipment
            </Link>

            <Link
              href="/community"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-brand-primary/5 hover:text-brand-primary rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              Community
            </Link>

            {/* Mobile Categories */}
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Photo Categories
              </p>
              <div className="grid grid-cols-2 gap-1">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.value}
                    href={`/explore?category=${cat.value}`}
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-brand-primary/5 hover:text-brand-primary rounded-lg transition-colors"
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/upload"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-brand-primary/5 hover:text-brand-primary rounded-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
              Sell Photo
            </Link>

            <Link
              href="/shopping/sell"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-brand-primary/5 hover:text-brand-primary rounded-lg transition-colors"
            >
              <Package className="w-4 h-4" />
              Sell Equipment
            </Link>

            <div className="border-t border-surface-border pt-3 mt-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-brand-primary/10">
                      {profile?.avatarUrl ? (
                        <Image
                          src={profile.avatarUrl}
                          alt={profile.displayName || ""}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-5 h-5 text-brand-primary" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-dark">
                        {profile?.displayName || user.displayName || "User"}
                      </p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full">ADMIN</span>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard?tab=listings"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    My Photo Listings
                  </Link>
                  <Link
                    href="/dashboard?tab=equipment"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    My Equipment Listings
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    href="/downloads"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    My Downloads
                  </Link>
                  <Link
                    href="/dashboard?tab=points"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Coins className="w-4 h-4" />
                    Points & Rewards
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="block w-full text-center bg-brand-primary text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-brand-primary/90 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
export { Navbar };
