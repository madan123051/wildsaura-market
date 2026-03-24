"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DebugPage() {
  const [photos, setPhotos] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPhotos() {
      try {
        const photosRef = collection(db, "photos");
        const snap = await getDocs(query(photosRef, orderBy("createdAt", "desc"), limit(20)));
        const results: Record<string, unknown>[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          results.push({
            id: doc.id,
            title: data.title ?? "NOT SET",
            category: data.category ?? "NOT SET",
            status: data.status ?? "NOT SET",
            isPublic: data.isPublic ?? "NOT SET",
            priceNPR: data.priceNPR ?? "NOT SET",
            ownerName: data.ownerName ?? "NOT SET",
            salesCount: data.salesCount ?? "NOT SET",
            tags: data.tags ?? "NOT SET",
            hasImageUrl: !!data.imageUrl,
            hasThumbnailUrl: !!data.thumbnailUrl,
            allFields: Object.keys(data).sort(),
          });
        });
        setPhotos(results);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchPhotos();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug: Photo Data ({photos.length} docs)</h1>
      <pre className="bg-gray-900 text-green-400 p-6 rounded-xl overflow-auto text-sm max-h-[80vh]">
        {JSON.stringify(photos, null, 2)}
      </pre>
    </div>
  );
}
