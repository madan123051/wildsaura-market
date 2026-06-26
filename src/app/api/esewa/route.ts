import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import admin from "@/lib/firebaseAdmin";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { generateTransactionId } from "@/lib/utils";
import type { ApiResponse } from "@/types";

/**
 * POST /api/esewa
 * Initiate eSewa payment for an order.
 *
 * Body: { orderId: string }
 * Headers: Authorization: Bearer <firebase_id_token>
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    const decoded = await adminAuth.verifyIdToken(token);

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    // ── Fetch order ─────────────────────────────────────────────
    const orderSnap = await adminDb.collection("orders").doc(orderId).get();
    if (!orderSnap.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }
    const order = orderSnap.data()!;

    // Verify order belongs to user
    if (order.buyerId !== decoded.uid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const transactionUuid = generateTransactionId();
    const amount = order.totalNPR as number;
    const merchantCode = process.env.ESEWA_MERCHANT_CODE!;
    const secretKey = process.env.ESEWA_SECRET_KEY!;

    // ── HMAC-SHA256 Signature (required by eSewa v2) ────────────
    const signatureInput = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${merchantCode}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(signatureInput)
      .digest("base64");

    // ── Update order with transaction reference ──────────────────
    await adminDb.collection("orders").doc(orderId).update({
      transactionUuid,
      paymentStatus: "redirecting",
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        paymentUrl: process.env.ESEWA_PAYMENT_URL,
        formFields: {
          amount: amount.toString(),
          tax_amount: "0",
          total_amount: amount.toString(),
          transaction_uuid: transactionUuid,
          product_code: merchantCode,
          product_service_charge: "0",
          product_delivery_charge: "0",
          success_url: `${appUrl}/payment/success?tid=${transactionUuid}&oid=${orderId}`,
          failure_url: `${appUrl}/payment/failure?oid=${orderId}`,
          signed_field_names: "total_amount,transaction_uuid,product_code",
          signature,
        },
      },
    });
  } catch (err: unknown) {
    console.error("[/api/esewa] Error:", err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/esewa?tid=<transaction_uuid>&oid=<orderId>
 * Verify payment status after eSewa callback, complete the order.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tid = searchParams.get("tid");
    const oid = searchParams.get("oid");

    if (!tid || !oid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing tid or oid" },
        { status: 400 }
      );
    }

    // ── Fetch order ───────────────────────────────────────────
    const orderRef = adminDb.collection("orders").doc(oid);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }
    const order = orderSnap.data()!;

    // Already completed? Don't re-process
    if (order.status === "paid") {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Payment already verified",
        data: { orderId: oid },
      });
    }

    // ── Verify with eSewa server-to-server ────────────────────
    const verifyUrl = `${process.env.ESEWA_VERIFY_URL}?product_code=${process.env.ESEWA_MERCHANT_CODE}&transaction_uuid=${tid}&total_amount=${order.totalNPR}`;
    const verifyRes = await fetch(verifyUrl);
    const verifyData = await verifyRes.json();

    if (verifyData.status !== "COMPLETE") {
      await orderRef.update({ status: "failed", paymentStatus: "failed" });
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // ── Payment verified — complete the order ─────────────────

    // 1. Update order → paid
    await orderRef.update({
      status: "paid",
      paymentStatus: "verified",
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      transactionRef: tid,
    });

    // 2. Fulfill each order item.
    const items = order.items || [];
    const buyerId = order.buyerId;
    const buyerEmail = order.buyerEmail || "";

    const promises = items.map(async (item: any) => {
      if (item.itemType === "equipment") {
        const equipmentId = item.equipmentId || item.photoId;
        let sellerId = item.sellerId || "";
        let sellerName = item.sellerName || "";

        try {
          const equipmentRef = adminDb.collection("equipmentListings").doc(equipmentId);
          const equipmentSnap = await equipmentRef.get();
          if (equipmentSnap.exists) {
            const equipmentData = equipmentSnap.data()!;
            sellerId = sellerId || equipmentData.sellerId || "";
            sellerName = sellerName || equipmentData.sellerName || "";
            await equipmentRef.update({
              status: "sold",
              salesCount: (equipmentData.salesCount || 0) + 1,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        } catch {}

        await adminDb.collection("equipmentPurchases").add({
          buyerId,
          buyerEmail,
          equipmentId,
          equipmentTitle: item.title,
          thumbnailUrl: item.thumbnailUrl,
          sellerId,
          sellerName,
          amountNPR: item.priceNPR,
          orderId: oid,
          paymentMethod: "esewa",
          transactionRef: tid,
          status: "completed",
          trackingStatus: "paid",
          purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return;
      }

      // Fetch the actual high-res imageUrl from the photo document
      let imageUrl = "";
      let sellerId = "";
      let sellerName = "";
      try {
        const photoSnap = await adminDb
          .collection("photos")
          .doc(item.photoId)
          .get();
        if (photoSnap.exists) {
          const photoData = photoSnap.data()!;
          imageUrl = photoData.imageUrl || "";
          sellerId = photoData.ownerId || "";
          sellerName =
            photoData.photographerName || photoData.ownerName || "";
        }
      } catch {
        // Will be resolved via secure download API as fallback
      }

      // Create download record
      await adminDb.collection("downloads").add({
        orderId: oid,
        photoId: item.photoId,
        buyerId,
        imageUrl,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
        purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update salesCount
      try {
        const photoRef = adminDb.collection("photos").doc(item.photoId);
        const snap = await photoRef.get();
        if (snap.exists) {
          await photoRef.update({
            salesCount: (snap.data()?.salesCount || 0) + 1,
          });
        }
      } catch {}

      // Create purchase record
      await adminDb.collection("purchases").add({
        buyerId,
        buyerEmail,
        photoId: item.photoId,
        photoTitle: item.title,
        sellerId,
        sellerName,
        amountNPR: item.priceNPR,
        orderId: oid,
        paymentMethod: "esewa",
        transactionRef: tid,
        status: "completed",
        purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await Promise.all(promises);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Payment verified and order completed",
      data: { orderId: oid },
    });
  } catch (err: unknown) {
    console.error("[/api/esewa GET] Error:", err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
