"use client";

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import type { CartItem } from "@/types";

const CART_KEY = "wildsaura_cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      /* ignore corrupt data */
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  const addToCart = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.find((i) => i.photoId === item.photoId)) {
        toast("Already in cart!", { icon: "🛒" });
        return prev;
      }
      toast.success(`"${item.title}" added to cart`);
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((photoId: string) => {
    setItems((prev) => prev.filter((i) => i.photoId !== photoId));
    toast("Removed from cart", { icon: "🗑️" });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_KEY);
  }, []);

  const totalNPR = items.reduce((sum, i) => sum + i.priceNPR, 0);
  const count = items.length;

  return { items, addToCart, removeFromCart, clearCart, totalNPR, count, loaded };
}
