import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

const ADMIN_EMAIL = "madan123050@gmail.com";
const SETTINGS_DOC = "ai-config";
const SETTINGS_COLLECTION = "settings";

// GET — Load AI settings
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC);
    const snap = await docRef.get();

    if (!snap.exists) {
      // Return defaults
      return NextResponse.json({
        photoAnalysis: {
          label: "Photo Analysis AI",
          description: "Analyzes uploaded photos — generates title, tags, category, quality score & price suggestion",
          provider: "gemini",
          apiKey: "",
          model: "gemini-1.5-flash",
          enabled: true,
        },
        chatbot: {
          label: "Market Chatbot AI",
          description: "Customer support chatbot — answers market queries, photo search help, pricing info",
          provider: "gemini",
          apiKey: "",
          model: "gemini-1.5-flash",
          enabled: false,
          systemPrompt: "You are WildSaura Market assistant. Help users find photos, understand pricing, and navigate the marketplace. Be friendly and concise. Answer in the user's language.",
        },
        contentModeration: {
          label: "Content Moderation AI",
          description: "Auto-screens uploads for inappropriate, copyrighted, or low-quality content",
          provider: "gemini",
          apiKey: "",
          model: "gemini-1.5-flash",
          enabled: false,
        },
        seoOptimization: {
          label: "SEO & Description AI",
          description: "Generates SEO-optimized titles, meta descriptions & alt text for better discoverability",
          provider: "gemini",
          apiKey: "",
          model: "gemini-1.5-flash",
          enabled: false,
        },
      });
    }

    return NextResponse.json(snap.data());
  } catch (error) {
    console.error("AI Settings GET Error:", error);
    return NextResponse.json(
      { error: "Failed to load AI settings" },
      { status: 500 }
    );
  }
}

// POST — Save AI settings
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Validate structure
    const validKeys = ["photoAnalysis", "chatbot", "contentModeration", "seoOptimization"];
    const sanitized: Record<string, unknown> = {};

    for (const key of validKeys) {
      if (body[key]) {
        sanitized[key] = {
          label: body[key].label || "",
          description: body[key].description || "",
          provider: body[key].provider || "gemini",
          apiKey: body[key].apiKey || "",
          model: body[key].model || "gemini-1.5-flash",
          enabled: Boolean(body[key].enabled),
          ...(key === "chatbot" ? { systemPrompt: body[key].systemPrompt || "" } : {}),
        };
      }
    }

    sanitized.updatedAt = new Date().toISOString();
    sanitized.updatedBy = decoded.email;

    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC);
    await docRef.set(sanitized, { merge: true });

    return NextResponse.json({ success: true, message: "AI settings saved successfully" });
  } catch (error) {
    console.error("AI Settings POST Error:", error);
    return NextResponse.json(
      { error: "Failed to save AI settings" },
      { status: 500 }
    );
  }
}
