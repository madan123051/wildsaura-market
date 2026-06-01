"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Leaf,
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
  Camera,
  ImageIcon,
  Users,
  ShoppingBag,
  Upload,
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { clearSessionCookie } from "@/lib/session";
import type { UserProfile, CartItem } from "@/types";
import { CATEGORIES } from "@/types";

const ADMIN_EMAIL = "madan123050@gmail.com";

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
  const [scrolled, setScrolled] = useState(false);

  const categoriesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.email === ADMIN_EMAIL || profile?.role === "admin";

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
      }
    });
    return () => unsub();
  }, []);

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
      console.error("Logout failed");
    }
  };

  return (
    <nav
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled
          ? "bg-white shadow-lg"
          : "bg-gradient-to-b from-white to-gray-50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main navbar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className="text-xl font-bold text-gray-800">WildSaura</span>
          </Link>

          {/* Search bar (desktop) */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center flex-1 mx-8"
          >
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search photos or equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Photos Dropdown */}
            <div ref={categoriesRef} className="relative">
              <button
                onClick={() => {
                  setShowCategories(!showCategories);
                  setShowUserMenu(false);
                }}
                className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 font-medium"
              >
                <Camera className="w-5 h-5" />
                <span>Photos</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showCategories ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Categories dropdown menu */}
              {showCategories && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl p-2 border border-gray-200">
                  <Link
                    href="/explore"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Explore All
                  </Link>
                  {CATEGORIES.map((category) => (
                    <Link
                      key={category.value}
                      href={`/explore?category=${category.value}`}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      {category.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Shopping Marketplace */}
            <Link
              href="/shopping"
              className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 font-medium transition"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Shop</span>
            </Link>

            {/* Sell Button - Prominent Blue Gradient */}
            {user && (
              <Link
                href="/shopping/sell"
                className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
              >
                <Upload className="w-4 h-4" />
                <span>Sell</span>
              </Link>
            )}

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative flex items-center text-gray-700 hover:text-gray-900"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowCategories(false);
                }}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
              >
                {profile?.profileImage ? (
                  <Image
                    src={profile.profileImage}
                    alt={profile.username}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </button>

              {/* User dropdown menu */}
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl p-2 border border-gray-200">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="font-semibold text-gray-800">
                          {profile?.username || user.email}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        <User className="w-4 h-4 inline mr-2" />
                        Profile
                      </Link>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        <LayoutDashboard className="w-4 h-4 inline mr-2" />
                        Dashboard
                      </Link>
                      {isAdmin && (
                        <>
                          <div className="border-t border-gray-200 my-2"></div>
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            <ShieldCheck className="w-4 h-4 inline mr-2" />
                            Admin Panel
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        <LogOut className="w-4 h-4 inline mr-2" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-gray-700 hover:text-gray-900"
          >
            {showMobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <form onSubmit={handleSearch} className="md:hidden mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </button>

            <Link
              href="/explore"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setShowMobileMenu(false)}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Photos
            </Link>

            <Link
              href="/shopping"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setShowMobileMenu(false)}
            >
              <ShoppingBag className="w-4 h-4 inline mr-2" />
              Shopping
            </Link>

            {user && (
              <Link
                href="/shopping/sell"
                className="block px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold"
                onClick={() => setShowMobileMenu(false)}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Sell
              </Link>
            )}

            <Link
              href="/cart"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setShowMobileMenu(false)}
            >
              <ShoppingCart className="w-4 h-4 inline mr-2" />
              Cart {cartCount > 0 && `(${cartCount})`}
            </Link>

            <div className="border-t border-gray-200 my-2"></div>

            {user ? (
              <>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Profile
                </Link>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <LayoutDashboard className="w-4 h-4 inline mr-2" />
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-red-700 hover:bg-red-50 rounded-lg"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <ShieldCheck className="w-4 h-4 inline mr-2" />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <LogOut className="w-4 h-4 inline mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
