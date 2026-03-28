import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

/**
 * GET /api/download/[photoId]
 *
 * Secure download endpoint — returns a ZIP containing:
 * 1. Watermarked photo (invisible license code embedded)
 * 2. LICENSE.txt certificate with photographer info, camera data, unique code
 *
 * Each download generates a unique license code stored in Firestore.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    /* ═══ 1. Authenticate ═══ */
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Login required to download." },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let uid: string;
    let email: string = "";
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
      email = decoded.email || "";
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired session. Please log in again." },
        { status: 401 }
      );
    }

    const { photoId } = params;

    /* ═══ 2. Check Purchase ═══ */
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

    const downloadDoc = downloadsSnap.docs[0].data();

    /* ═══ 3. Fetch Photo Data ═══ */
    const photoDoc = await adminDb.collection("photos").doc(photoId).get();
    if (!photoDoc.exists) {
      return NextResponse.json(
        { error: "Photo not found." },
        { status: 404 }
      );
    }

    const photo = photoDoc.data()!;
    const imageUrl = photo.imageUrl;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Download link is not yet available." },
        { status: 404 }
      );
    }

    /* ═══ 4. Fetch Photographer Info ═══ */
    let photographerName = photo.ownerName || "WildSaura Photographer";
    let photographerEmail = "";
    let cameraInfo = "Not specified";
    let cameraSettings = "Not specified";

    if (photo.ownerId) {
      try {
        const userDoc = await adminDb
          .collection("users")
          .doc(photo.ownerId)
          .get();
        if (userDoc.exists) {
          const userData = userDoc.data()!;
          photographerName = userData.displayName || photographerName;
          photographerEmail = userData.email || "";
          cameraInfo = userData.camera || userData.cameraModel || "Not specified";
          cameraSettings = userData.cameraSettings || "Not specified";
        }
      } catch {
        // Fallback — use photo data
      }
    }

    /* ═══ 5. Generate Unique License Code ═══ */
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
    const licenseCode = `WS-${timestamp}-${randomPart}`;

    /* ═══ 6. Create License Certificate ═══ */
    const purchaseDate = downloadDoc.purchasedAt?.toDate?.()
      ? downloadDoc.purchasedAt.toDate().toISOString()
      : new Date().toISOString();

    const downloadDate = new Date().toISOString();

    const licenseTxt = [
      "╔══════════════════════════════════════════════════════════════════╗",
      "║                   WILDSAURA MARKET                             ║",
      "║               PHOTO LICENSE CERTIFICATE                        ║",
      "╚══════════════════════════════════════════════════════════════════╝",
      "",
      `  License Number  : ${licenseCode}`,
      `  License Type    : Standard Commercial License`,
      `  Status          : VALID ✓`,
      "",
      "──────────────────── PHOTO DETAILS ────────────────────",
      "",
      `  Title           : ${photo.title || "Untitled"}`,
      `  Description     : ${photo.description || "N/A"}`,
      `  Category        : ${(photo.category || "general").toUpperCase()}`,
      `  Tags            : ${(photo.tags || []).join(", ") || "N/A"}`,
      `  Resolution      : ${photo.width || "N/A"} × ${photo.height || "N/A"} px`,
      `  File Size       : ${photo.fileSize ? (photo.fileSize / 1024 / 1024).toFixed(2) + " MB" : "N/A"}`,
      `  Quality Score   : ${photo.qualityScore || photo.aiQualityScore || "N/A"}/10`,
      "",
      "──────────────────── PHOTOGRAPHER ─────────────────────",
      "",
      `  Name            : ${photographerName}`,
      `  Contact         : ${photographerEmail || "Via WildSaura Market"}`,
      `  Camera          : ${cameraInfo}`,
      `  Camera Settings : ${cameraSettings}`,
      "",
      "──────────────────── PURCHASE INFO ────────────────────",
      "",
      `  Buyer           : ${email}`,
      `  Purchase Date   : ${new Date(purchaseDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      `  Download Date   : ${new Date(downloadDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      `  Price           : NPR ${photo.priceNPR || "N/A"}`,
      `  Order ID        : ${downloadDoc.orderId || "N/A"}`,
      "",
      "──────────────────── VERIFICATION ─────────────────────",
      "",
      `  Verification Code : ${licenseCode}`,
      `  Verify Online     : https://market.wildsaura.com/verify?code=${licenseCode}`,
      "",
      "  This photo contains an embedded invisible watermark that",
      "  matches this license code. To verify authenticity, visit",
      "  the URL above or zoom into the bottom-right corner of",
      "  the photo and adjust contrast.",
      "",
      "──────────────────── LICENSE TERMS ─────────────────────",
      "",
      "  ✓ Commercial & personal use allowed",
      "  ✓ Use in websites, apps, print materials",
      "  ✓ Modify, crop, edit as needed",
      "  ✗ Cannot resell as-is (no redistribution)",
      "  ✗ Cannot claim photographer credit",
      "  ✗ Cannot use in illegal or defamatory content",
      "",
      "  Full terms: https://market.wildsaura.com/terms",
      "",
      "══════════════════════════════════════════════════════════",
      `  © ${new Date().getFullYear()} WildSaura Market — All Rights Reserved`,
      "  support@wildsaura.com | market.wildsaura.com",
      "══════════════════════════════════════════════════════════",
    ].join("\n");

    /* ═══ 7. Fetch Original Image ═══ */
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return NextResponse.json(
        { error: "Could not fetch the original image." },
        { status: 500 }
      );
    }
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    /* ═══ 8. Add Invisible Watermark ═══ */
    let watermarkedBuffer: Buffer;
    try {
      const sharp = (await import("sharp")).default;
      const metadata = await sharp(imageBuffer).metadata();
      const imgWidth = metadata.width || 1920;
      const imgHeight = metadata.height || 1080;

      // Tiny, low-opacity watermark text in bottom-right corner
      const fontSize = Math.max(8, Math.floor(imgWidth * 0.004));
      const padding = Math.floor(imgWidth * 0.01);

      const svgWatermark = `
        <svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
          <style>
            .wm {
              font-family: monospace;
              font-size: ${fontSize}px;
              fill: rgba(255,255,255,0.04);
              text-anchor: end;
            }
            .wm2 {
              font-family: monospace;
              font-size: ${fontSize}px;
              fill: rgba(0,0,0,0.03);
              text-anchor: end;
            }
          </style>
          <!-- White version for dark areas -->
          <text x="${imgWidth - padding}" y="${imgHeight - padding}" class="wm">${licenseCode}</text>
          <text x="${imgWidth - padding}" y="${imgHeight - padding - fontSize - 2}" class="wm">WildSaura License</text>
          <!-- Dark version for light areas -->
          <text x="${imgWidth - padding}" y="${imgHeight - padding + 1}" class="wm2">${licenseCode}</text>
          <text x="${imgWidth - padding}" y="${imgHeight - padding - fontSize - 1}" class="wm2">WildSaura License</text>
          <!-- Scattered micro-codes across image -->
          <text x="${padding}" y="${padding + fontSize}" class="wm" text-anchor="start" style="font-size:${Math.max(6, fontSize - 2)}px">${licenseCode}</text>
          <text x="${Math.floor(imgWidth / 2)}" y="${Math.floor(imgHeight / 2)}" class="wm" text-anchor="middle" style="font-size:${Math.max(6, fontSize - 2)}px;fill:rgba(128,128,128,0.02)">${licenseCode}</text>
        </svg>
      `;

      watermarkedBuffer = await sharp(imageBuffer)
        .composite([
          {
            input: Buffer.from(svgWatermark),
            top: 0,
            left: 0,
            blend: "over",
          },
        ])
        .jpeg({ quality: 95 })
        .toBuffer();
    } catch (sharpError) {
      console.warn("Sharp watermark failed, using original:", sharpError);
      watermarkedBuffer = imageBuffer;
    }

    /* ═══ 9. Create ZIP ═══ */
    let zipBuffer: Buffer;
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Determine file extension
      const ext =
        imageUrl.includes(".png") ? ".png" :
        imageUrl.includes(".webp") ? ".webp" : ".jpg";

      const safeTitle = (photo.title || "photo")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 50);

      zip.file(`${safeTitle}${ext}`, watermarkedBuffer);
      zip.file("LICENSE.txt", licenseTxt);

      zipBuffer = Buffer.from(
        await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
      );
    } catch (zipError) {
      console.error("ZIP creation failed:", zipError);
      // Fallback: return just the image
      return new NextResponse(watermarkedBuffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": `attachment; filename="${photo.title || "photo"}.jpg"`,
        },
      });
    }

    /* ═══ 10. Store License in Firestore ═══ */
    try {
      await adminDb.collection("licenses").add({
        licenseCode,
        photoId,
        photoTitle: photo.title || "Untitled",
        thumbnailUrl: photo.thumbnailUrl || "",
        buyerId: uid,
        buyerEmail: email,
        photographerId: photo.ownerId || "",
        photographerName,
        category: photo.category || "",
        priceNPR: photo.priceNPR || 0,
        orderId: downloadDoc.orderId || "",
        purchaseDate: downloadDoc.purchasedAt || new Date(),
        downloadDate: new Date(),
        isValid: true,
        licenseType: "standard",
        hasWatermark: true,
      });
    } catch (firestoreErr) {
      console.warn("License store failed (non-blocking):", firestoreErr);
      // Non-blocking — still deliver the download
    }

    /* ═══ 11. Update download record with license code ═══ */
    try {
      await adminDb
        .collection("downloads")
        .doc(downloadsSnap.docs[0].id)
        .update({
          lastLicenseCode: licenseCode,
          lastDownloadAt: new Date(),
          downloadCount: (downloadDoc.downloadCount || 0) + 1,
        });
    } catch {
      // Non-blocking
    }

    /* ═══ 12. Return ZIP ═══ */
    const safeTitle = (photo.title || "photo")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 50);

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="WildSaura_${safeTitle}_${licenseCode}.zip"`,
        "X-License-Code": licenseCode,
      },
    });
  } catch (error) {
    console.error("Secure download error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}
