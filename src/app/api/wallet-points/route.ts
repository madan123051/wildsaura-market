import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { generateTransactionId } from "@/lib/utils";
import type { ApiResponse } from "@/types";

/**
 * POST /api/wallet-points
 * Complete an order using WildSaura wallet points.
 *
 * Body: { orderId: string }
 * Headers: Authorization: Bearer <firebase_id_token>
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    let balanceAfter = 0;
    let pointsUsed = 0;

    await adminDb.runTransaction(async (tx) => {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const userRef = adminDb.collection("users").doc(decoded.uid);

      const [orderSnap, userSnap] = await Promise.all([
        tx.get(orderRef),
        tx.get(userRef),
      ]);

      if (!orderSnap.exists) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const order = orderSnap.data()!;
      if (order.buyerId !== decoded.uid) {
        throw new Error("UNAUTHORIZED_ORDER");
      }

      if (order.status === "paid") {
        balanceAfter = Number(userSnap.data()?.walletPoints || 0);
        pointsUsed = 0;
        return;
      }

      const amount = Math.round(Number(order.totalNPR || 0));
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("INVALID_ORDER_AMOUNT");
      }

      const currentPoints = Number(userSnap.data()?.walletPoints || 0);
      if (currentPoints < amount) {
        throw new Error(`INSUFFICIENT_POINTS:${currentPoints}:${amount}`);
      }

      const items = Array.isArray(order.items) ? order.items : [];
      const itemRefs = items.map((item: any) => {
        const itemType = item.itemType || "photo";
        const id =
          itemType === "equipment"
            ? item.equipmentId || item.photoId
            : item.photoId;
        const collectionName =
          itemType === "equipment" ? "equipmentListings" : "photos";
        return id ? adminDb.collection(collectionName).doc(id) : null;
      });

      const itemSnaps = await Promise.all(
        itemRefs.map((ref) => (ref ? tx.get(ref) : Promise.resolve(null)))
      );

      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const transactionRef = `POINTS-${generateTransactionId()}`;
      balanceAfter = currentPoints - amount;
      pointsUsed = amount;

      tx.update(userRef, {
        walletPoints: balanceAfter,
        updatedAt: timestamp,
      });

      tx.update(orderRef, {
        status: "paid",
        paymentStatus: "verified",
        trackingStatus: "paid",
        paidAt: timestamp,
        transactionRef,
      });

      tx.create(adminDb.collection("pointTransactions").doc(), {
        userId: decoded.uid,
        type: "purchase_spend",
        title: "Purchase with points",
        description: `Used ${amount} points for order ${orderId}`,
        points: -amount,
        balanceAfter,
        orderId,
        createdAt: timestamp,
      });

      tx.create(adminDb.collection("notifications").doc(), {
        userId: decoded.uid,
        title: "Points used",
        message: `${amount} points were used for your WildSaura purchase.`,
        points: -amount,
        orderId,
        read: false,
        createdAt: timestamp,
      });

      items.forEach((item: any, index: number) => {
        const itemType = item.itemType || "photo";
        const itemRef = itemRefs[index];
        const itemSnap = itemSnaps[index];

        if (itemType === "equipment") {
          const equipmentId = item.equipmentId || item.photoId;
          if (!equipmentId) return;

          const equipmentData = itemSnap?.exists ? itemSnap.data()! : {};
          const sellerId = item.sellerId || equipmentData.sellerId || "";
          const sellerName = item.sellerName || equipmentData.sellerName || "";

          if (itemRef && itemSnap?.exists) {
            tx.update(itemRef, {
              status: "sold",
              salesCount: Number(equipmentData.salesCount || 0) + 1,
              updatedAt: timestamp,
            });
          }

          tx.create(adminDb.collection("equipmentPurchases").doc(), {
            buyerId: decoded.uid,
            buyerEmail: order.buyerEmail || decoded.email || "",
            equipmentId,
            equipmentTitle: item.title,
            thumbnailUrl: item.thumbnailUrl,
            sellerId,
            sellerName,
            amountNPR: item.priceNPR,
            orderId,
            paymentMethod: "wallet_points",
            transactionRef,
            status: "completed",
            trackingStatus: "paid",
            purchasedAt: timestamp,
          });

          return;
        }

        const photoId = item.photoId;
        if (!photoId) return;

        const photoData = itemSnap?.exists ? itemSnap.data()! : {};
        const sellerId = photoData.ownerId || item.ownerId || "";
        const sellerName =
          photoData.photographerName ||
          photoData.ownerName ||
          item.ownerName ||
          "";

        tx.create(adminDb.collection("downloads").doc(), {
          orderId,
          photoId,
          buyerId: decoded.uid,
          imageUrl: photoData.imageUrl || "",
          title: item.title,
          thumbnailUrl: item.thumbnailUrl,
          purchasedAt: timestamp,
        });

        if (itemRef && itemSnap?.exists) {
          tx.update(itemRef, {
            salesCount: Number(photoData.salesCount || 0) + 1,
          });
        }

        tx.create(adminDb.collection("purchases").doc(), {
          buyerId: decoded.uid,
          buyerEmail: order.buyerEmail || decoded.email || "",
          photoId,
          photoTitle: item.title,
          sellerId,
          sellerName,
          amountNPR: item.priceNPR,
          orderId,
          paymentMethod: "wallet_points",
          transactionRef,
          status: "completed",
          purchasedAt: timestamp,
        });
      });
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message:
        pointsUsed > 0
          ? "Order completed with wallet points"
          : "Order was already completed",
      data: { orderId, pointsUsed, balanceAfter },
    });
  } catch (err: unknown) {
    const message = (err as Error).message || "Wallet payment failed";

    if (message.startsWith("INSUFFICIENT_POINTS:")) {
      const [, current, required] = message.split(":");
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Insufficient points. You have ${current}, but need ${required}.`,
        },
        { status: 400 }
      );
    }

    if (message === "ORDER_NOT_FOUND") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (message === "UNAUTHORIZED_ORDER") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    console.error("[/api/wallet-points] Error:", err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
