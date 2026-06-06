"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Redirects /equipment/sell → /shopping/sell
 * Consolidates duplicate sell pages into one canonical route.
 */
export default function EquipmentSellRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const editId = searchParams.get("edit");
    const destination = editId
      ? `/shopping/sell?edit=${editId}`
      : "/shopping/sell";
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirecting to sell page…</p>
    </div>
  );
}
