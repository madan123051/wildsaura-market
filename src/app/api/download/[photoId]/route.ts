import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

/**
 * GET /api/download/[photoId]
 *
 * Secure download endpoint — only returns the original hi-res
 * image URL AFTER verifying the caller has purchased the photo.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    /* 1. Authenticate */
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Login required to download." },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired session. Please log in again." },
        { status: 401 }
      );
    }

    const { photoId } = params;

    /* 2. Check if user purchased this photo */
    const downloadsSnap = await adminDb
      .collection("downloads")
      .where("buyerId", "==", uid)
      .where("photoId", "==", photoId)
      .limit(1)
      .get();

    if (downloadsSnap.empty) {
      return NextResponse.json(
        { error: "Purchase required. Please buy this photo first." },
        { status: 403 }
      );
    }

    /* 3. Fetch original high-res URL from photos collection */
    const photoDoc = await adminDb.collection("photos").doc(photoId).get();
    if (!photoDoc.exists) {
      return NextResponse.json(
        { error: "Photo not found." },
        { status: 404 }
      );
    }

    const photoData = photoDoc.data();
    const imageUrl = photoData?.imageUrl;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Download link is not yet available." },
        { status: 404 }
      );
    }

    /* 4. Return the secure download URL */
    return NextResponse.json({ downloadUrl: imageUrl });
  } catch (error) {
    console.error("Secure download error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}
