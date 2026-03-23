"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import type { CartItem } from "@/types";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

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
  }, []);

  const totalNPR = items.reduce((sum, i) => sum + i.priceNPR, 0);
  const count    = items.length;

  return { items, addToCart, removeFromCart, clearCart, totalNPR, count };
}
