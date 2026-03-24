import { NextResponse } from "next/server";
import { collection, query, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    const photosRef = collection(db, "photos");
    const snap = await getDocs(query(photosRef, limit(20)));
    const photos: Record<string, unknown>[] = [];

    snap.forEach((doc) => {
      photos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return NextResponse.json({
      totalDocs: snap.size,
      photos: photos.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        status: p.status,
        isPublic: p.isPublic,
        priceNPR: p.priceNPR,
        ownerName: p.ownerName,
        salesCount: p.salesCount,
        tags: p.tags,
        hasImageUrl: !!p.imageUrl,
        hasThumbnailUrl: !!p.thumbnailUrl,
        createdAt: p.createdAt,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
