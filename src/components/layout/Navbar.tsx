"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, LogOut, Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

interface NavbarProps {
  cartCount?: number;
}

export function Navbar({ cartCount = 0 }: NavbarProps) {
  const { user, profile, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-white/80 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl text-brand-primary">
            🌿 WildSaura
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/explore" className="hover:text-brand-primary transition-colors">Explore</Link>
            <Link href="/explore?category=nature" className="hover:text-brand-primary transition-colors">Nature</Link>
            <Link href="/explore?category=culture" className="hover:text-brand-primary transition-colors">Culture</Link>
            <Link href="/explore?category=wildlife" className="hover:text-brand-primary transition-colors">Wildlife</Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link href="/explore" className="p-2 rounded-xl hover:bg-surface-muted text-gray-600">
              <Search size={20} />
            </Link>

            {/* Cart */}
            <button className="relative p-2 rounded-xl hover:bg-surface-muted text-gray-600">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[10px] text-white font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-surface-muted cursor-pointer">
                    <div className="h-7 w-7 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-sm font-bold">
                      {profile?.displayName?.charAt(0).toUpperCase() ?? "U"}
                    </div>
                    <span className="hidden md:block text-sm font-medium text-brand-dark">
                      {profile?.displayName?.split(" ")[0]}
                    </span>
                  </div>
                </Link>
                <button onClick={logout} className="p-2 rounded-xl hover:bg-surface-muted text-gray-500" title="Logout">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link href="/(auth)/login">
                <Button size="sm">Login</Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-surface-border py-4 flex flex-col gap-3 text-sm font-medium text-gray-600">
            <Link href="/explore" onClick={() => setMobileOpen(false)}>Explore</Link>
            <Link href="/explore?category=nature" onClick={() => setMobileOpen(false)}>Nature</Link>
            <Link href="/explore?category=culture" onClick={() => setMobileOpen(false)}>Culture</Link>
            <Link href="/explore?category=wildlife" onClick={() => setMobileOpen(false)}>Wildlife</Link>
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
