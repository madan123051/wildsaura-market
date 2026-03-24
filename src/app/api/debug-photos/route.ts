import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, query, getDocs, limit } from "firebase/firestore";

// Server-side Firebase init (can't import from @/lib/firebase because it has "use client")
function getDb() {
  const app =
    getApps().length === 0
      ? initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
        })
      : getApps()[0];
  return getFirestore(app);
}

export async function GET() {
  try {
    const db = getDb();
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
        category: p.category ?? "NOT SET",
        status: p.status ?? "NOT SET",
        isPublic: p.isPublic ?? "NOT SET",
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
