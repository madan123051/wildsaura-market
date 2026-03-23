import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import type { ApiResponse } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface TagsRequestBody {
  photoId: string;       // Firestore photo document ID
  imageUrl: string;      // Publicly accessible image URL (Firebase Storage)
}

interface TagsResult {
  title: string;
  description: string;
  tags: string[];
  category: string;
  aiQualityScore: number;
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth guard ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);

    // ── Parse request ──────────────────────────────────────────
    const body: TagsRequestBody = await req.json();
    const { photoId, imageUrl } = body;

    if (!photoId || !imageUrl) {
      return NextResponse.json<ApiResponse>({ success: false, error: "photoId and imageUrl required" }, { status: 400 });
    }

    // ── Verify photo belongs to this user ──────────────────────
    const photoRef  = adminDb.collection("photos").doc(photoId);
    const photoSnap = await photoRef.get();
    if (!photoSnap.exists || photoSnap.data()?.ownerId !== decoded.uid) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Photo not found or access denied" }, { status: 403 });
    }

    // ── Gemini Vision Analysis ─────────────────────────────────
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a professional stock photo editor specializing in Nepal and South Asia photography.
Analyze this image and respond ONLY with valid JSON in the exact format below:

{
  "title": "A catchy, SEO-friendly title (max 10 words)",
  "description": "2-3 sentence description highlighting the subject, mood, and potential use cases",
  "tags": ["tag1", "tag2", ... 15 relevant keywords in English],
  "category": "one of: nature, wildlife, culture, food, architecture, people, adventure, abstract, aerial, other",
  "aiQualityScore": <number 1.0–10.0 based on: composition, lighting, focus, uniqueness, commercial value>
}

Prioritize Nepal-specific tags (locations, festivals, animals). Tags must be lowercase, single words or short phrases.`;

    // Fetch image as base64 for Gemini
    const imgRes    = await fetch(imageUrl);
    const imgBuffer = await imgRes.arrayBuffer();
    const base64    = Buffer.from(imgBuffer).toString("base64");
    const mimeType  = imgRes.headers.get("content-type") ?? "image/jpeg";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64, mimeType } },
    ]);

    const rawText = result.response.text().trim();
    // Extract JSON from markdown code block if present
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) ?? rawText.match(/({[\s\S]*})/);
    const jsonStr   = jsonMatch ? jsonMatch[1] : rawText;
    const aiData: TagsResult = JSON.parse(jsonStr);

    // ── Update Firestore ───────────────────────────────────────
    await photoRef.update({
      title:          aiData.title,
      description:    aiData.description,
      tags:           aiData.tags,
      category:       aiData.category,
      aiQualityScore: aiData.aiQualityScore,
    });

    return NextResponse.json<ApiResponse<TagsResult>>({ success: true, data: aiData });

  } catch (err: unknown) {
    console.error("[/api/tags] Error:", err);
    return NextResponse.json<ApiResponse>({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
