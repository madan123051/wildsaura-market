import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import admin from "@/lib/firebaseAdmin";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { generateTransactionId } from "@/lib/utils";
import type { ApiResponse, PhotoPurchase } from "@/types";

/**
 * POST /api/esewa
 * Initiate eSewa payment: returns the form data to submit to eSewa.
 *
 * Body: { photoId: string, buyerId: string }
 * Headers: Authorization: Bearer <firebase_id_token>
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────
    const token   = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);

    const { photoId } = await req.json();

    // ── Fetch photo ─────────────────────────────────────────────
    const photoSnap = await adminDb.collection("photos").doc(photoId).get();
    if (!photoSnap.exists) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Photo not found" }, { status: 404 });
    }
    const photo = photoSnap.data()!;

    const transactionUuid = generateTransactionId();
    const amount          = photo.priceNPR as number;
    const merchantCode    = process.env.ESEWA_MERCHANT_CODE!;
    const secretKey       = process.env.ESEWA_SECRET_KEY!;

    // ── HMAC-SHA256 Signature (required by eSewa v2) ────────────
    const signatureInput = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${merchantCode}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(signatureInput)
      .digest("base64");

    // ── Save pending purchase in Firestore ──────────────────────
    const purchaseRef = adminDb.collection("purchases").doc(transactionUuid);
    const purchase = {
      purchaseId:     transactionUuid,
      buyerId:        decoded.uid,
      photoId,
      photoTitle:     photo.title as string,
      amountNPR:      amount,
      paymentMethod:  "esewa" as const,
      transactionRef: transactionUuid,
      status:         "pending" as const,
      purchasedAt:    admin.firestore.FieldValue.serverTimestamp(),
    };
    await purchaseRef.set(purchase);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        paymentUrl: process.env.ESEWA_PAYMENT_URL,
        formFields: {
          amount:               amount.toString(),
          tax_amount:           "0",
          total_amount:         amount.toString(),
          transaction_uuid:     transactionUuid,
          product_code:         merchantCode,
          product_service_charge: "0",
          product_delivery_charge: "0",
          success_url:          `${appUrl}/payment/success?tid=${transactionUuid}`,
          failure_url:          `${appUrl}/payment/failure?tid=${transactionUuid}`,
          signed_field_names:   "total_amount,transaction_uuid,product_code",
          signature,
        },
      },
    });

  } catch (err: unknown) {
    console.error("[/api/esewa] Error:", err);
    return NextResponse.json<ApiResponse>({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

/**
 * GET /api/esewa?tid=<transaction_uuid>
 * Verify payment status after eSewa callback.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tid    = searchParams.get("tid");
    const status = searchParams.get("status"); // COMPLETE | PENDING | FAILED

    if (!tid) return NextResponse.json<ApiResponse>({ success: false, error: "Missing tid" }, { status: 400 });

    const purchaseRef  = adminDb.collection("purchases").doc(tid);
    const purchaseSnap = await purchaseRef.get();
    if (!purchaseSnap.exists) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Purchase not found" }, { status: 404 });
    }

    if (status === "COMPLETE") {
      // Verify with eSewa server-to-server
      const verifyUrl = `${process.env.ESEWA_VERIFY_URL}?product_code=${process.env.ESEWA_MERCHANT_CODE}&transaction_uuid=${tid}&total_amount=${purchaseSnap.data()?.amountNPR}`;
      const verifyRes = await fetch(verifyUrl);
      const verifyData = await verifyRes.json();

      if (verifyData.status === "COMPLETE") {
        await purchaseRef.update({ status: "completed" });

        // Increment salesCount on photo
        const photoRef = adminDb.collection("photos").doc(purchaseSnap.data()?.photoId);
        await photoRef.update({ salesCount: (await photoRef.get()).data()?.salesCount + 1 });

        return NextResponse.json<ApiResponse>({ success: true, message: "Payment verified" });
      }
    }

    await purchaseRef.update({ status: "failed" });
    return NextResponse.json<ApiResponse>({ success: false, error: "Payment verification failed" });

  } catch (err: unknown) {
    console.error("[/api/esewa GET] Error:", err);
    return NextResponse.json<ApiResponse>({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
