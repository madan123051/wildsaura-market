import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import type { ApiResponse, PartnerLicense } from "@/types";

/**
 * POST /api/partners
 * Submit an approved photo to a partner platform (e.g., Shutterstock).
 * Currently stubs the Shutterstock API — replace with real SDK when ready.
 *
 * Body: { photoId: string, partner: "shutterstock" | "adobe_stock" | "getty" }
 */
export async function POST(req: NextRequest) {
  try {
    // ── Admin-only ──────────────────────────────────────────────
    const token   = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);

    const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
    if (userSnap.data()?.role !== "admin") {
      return NextResponse.json<ApiResponse>({ success: false, error: "Admin only" }, { status: 403 });
    }

    const { photoId, partner } = await req.json();

    // ── Fetch photo ─────────────────────────────────────────────
    const photoSnap = await adminDb.collection("photos").doc(photoId).get();
    if (!photoSnap.exists || photoSnap.data()?.status !== "approved") {
      return NextResponse.json<ApiResponse>({ success: false, error: "Photo not found or not approved" }, { status: 404 });
    }

    // ── TODO: Call real partner API ─────────────────────────────
    // Example for Shutterstock:
    // const response = await fetch("https://api.shutterstock.com/v2/images", {
    //   method: "POST",
    //   headers: { Authorization: `Bearer ${process.env.SHUTTERSTOCK_API_KEY}` },
    //   body: JSON.stringify({ ...photoData }),
    // });
    const mockExternalId = `SS-${Date.now()}`;

    // ── Log in Firestore ────────────────────────────────────────
    const license: Omit<PartnerLicense, "submittedAt"> & { submittedAt: unknown } = {
      partnerId:       partner,
      photoId,
      externalId:      mockExternalId,
      status:          "submitted",
      royaltyPercent:  30,
      submittedAt:     new Date(),
    };

    await adminDb
      .collection("photos")
      .doc(photoId)
      .collection("partnerLicenses")
      .add(license);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { externalId: mockExternalId },
      message: `Photo submitted to ${partner} successfully`,
    });

  } catch (err: unknown) {
    console.error("[/api/partners] Error:", err);
    return NextResponse.json<ApiResponse>({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

/**
 * GET /api/partners?photoId=<id>
 * Returns all partner license records for a photo.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("photoId");
    if (!photoId) return NextResponse.json<ApiResponse>({ success: false, error: "Missing photoId" }, { status: 400 });

    const snap = await adminDb
      .collection("photos")
      .doc(photoId)
      .collection("partnerLicenses")
      .orderBy("submittedAt", "desc")
      .get();

    const licenses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json<ApiResponse>({ success: true, data: licenses });

  } catch (err: unknown) {
    return NextResponse.json<ApiResponse>({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
