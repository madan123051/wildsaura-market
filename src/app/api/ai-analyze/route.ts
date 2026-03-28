import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// Valid PhotoCategory values that match the frontend types
const VALID_CATEGORIES = [
  "nature",
  "wildlife",
  "landscape",
  "street",
  "culture",
  "macro",
  "aerial",
  "underwater",
  "adventure",
] as const;

// Map common AI-generated categories to our valid PhotoCategory values
const CATEGORY_ALIASES: Record<string, string> = {
  animal: "wildlife", animals: "wildlife", bird: "wildlife", birds: "wildlife",
  insect: "macro", insects: "macro", flower: "macro", flowers: "macro",
  plant: "nature", plants: "nature", tree: "nature", trees: "nature", forest: "nature",
  mountain: "landscape", mountains: "landscape", ocean: "landscape", sea: "landscape",
  beach: "landscape", sunset: "landscape", sunrise: "landscape",
  city: "street", urban: "street", architecture: "street", building: "street", buildings: "street",
  people: "culture", person: "culture", portrait: "culture", festival: "culture",
  tradition: "culture", food: "culture",
  abstract: "macro", closeup: "macro", "close-up": "macro",
  drone: "aerial", sky: "aerial", flying: "aerial",
  water: "underwater", diving: "underwater", marine: "underwater", fish: "underwater", coral: "underwater",
  sport: "adventure", sports: "adventure", hiking: "adventure", climbing: "adventure",
  extreme: "adventure", travel: "adventure", other: "nature",
};

function normalizeCategory(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if ((VALID_CATEGORIES as readonly string[]).includes(lower)) return lower;
  if (CATEGORY_ALIASES[lower]) return CATEGORY_ALIASES[lower];
  return "nature";
}

// Helper: Get AI API key from Firestore settings (fallback to env)
async function getPhotoAnalysisConfig(): Promise<{ apiKey: string; model: string }> {
  try {
    const snap = await adminDb.collection("settings").doc("ai-config").get();
    if (snap.exists) {
      const data = snap.data();
      if (data?.photoAnalysis?.apiKey && data.photoAnalysis.enabled) {
        return {
          apiKey: data.photoAnalysis.apiKey,
          model: data.photoAnalysis.model || "gemini-1.5-flash",
        };
      }
    }
  } catch (e) {
    console.warn("Could not load AI settings from Firestore, using env fallback:", e);
  }
  return {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: "gemini-1.5-flash",
  };
}

export async function POST(req: Request) {
  try {
    const headers = {
      "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_DRISHYA_APP_URL || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers });
    }

    const { imageUrl } = await req.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "imageUrl is required and must be a string" },
        { status: 400, headers }
      );
    }

    // Get API key from Firestore (admin-managed) or fallback to env
    const config = await getPhotoAnalysisConfig();
    if (!config.apiKey) {
      return NextResponse.json(
        { error: "AI API key not configured. Please set it in Admin → AI Settings." },
        { status: 500, headers }
      );
    }

    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({ model: config.model });

    const prompt = `
      You are a professional stock photography marketplace quality reviewer.
      Analyze this image and provide TWO things:

      1. MARKETABILITY CHECK: Determine if this image is suitable for sale on a professional stock photography marketplace.
         An image is NOT marketable if it is:
         - Blurry, out of focus, or very low resolution
         - A screenshot, meme, or text-heavy image
         - Inappropriate, offensive, or contains harmful content
         - A random selfie with no artistic value
         - Extremely dark/overexposed with no detail visible
         - A duplicate/low-effort phone snap (e.g. random food on table with bad lighting)
         - Contains watermarks or copyrighted content from others

         An image IS marketable if it has:
         - Clear subject matter and decent composition
         - Reasonable technical quality (focus, exposure, sharpness)
         - Potential commercial or editorial use
         - Artistic or documentary value

      2. METADATA: If the image is marketable, generate metadata for the listing.

      Return STRICT JSON (no markdown, no code blocks):
      {
        "is_marketable": true,
        "rejection_reason": "",
        "title": "A descriptive 5-10 word title",
        "description": "A brief 2-sentence explanation of the photo",
        "tags": ["array", "of", "20", "relevant", "SEO", "keywords"],
        "category": "ONE of: nature, wildlife, landscape, street, culture, macro, aerial, underwater, adventure",
        "quality_score": 8,
        "market_demand": "High"
      }

      If the image is NOT marketable, return:
      {
        "is_marketable": false,
        "rejection_reason": "Clear reason why this image is not suitable for the marketplace (1-2 sentences in English)",
        "title": "",
        "description": "",
        "tags": [],
        "category": "nature",
        "quality_score": 2,
        "market_demand": "Low"
      }

      IMPORTANT:
      - is_marketable MUST be a boolean (true or false)
      - rejection_reason should be empty string if marketable, or a clear explanation if not
      - category MUST be exactly one of: nature, wildlife, landscape, street, culture, macro, aerial, underwater, adventure
      - quality_score must be 1-10
      - market_demand must be "High", "Medium", or "Low"
      - Return ONLY valid JSON, no extra text
    `;

    const imageResp = await fetch(imageUrl).then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
      return res.arrayBuffer();
    });

    const extension = imageUrl.split(".").pop()?.split("?")[0]?.toLowerCase();
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      gif: "image/gif", webp: "image/webp",
    };
    const mimeType = mimeMap[extension || ""] || "image/jpeg";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: Buffer.from(imageResp).toString("base64"), mimeType } },
    ]);

    const response = await result.response;
    const text = response.text();

    const cleanText = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleanText);

    parsed.is_marketable = parsed.is_marketable === true;
    if (typeof parsed.rejection_reason !== "string") {
      parsed.rejection_reason = parsed.is_marketable ? "" : "Image quality does not meet marketplace standards.";
    }
    parsed.category = normalizeCategory(parsed.category || "nature");
    parsed.quality_score = Math.min(10, Math.max(1, parseInt(parsed.quality_score) || 7));
    if (!["High", "Medium", "Low"].includes(parsed.market_demand)) {
      parsed.market_demand = "Medium";
    }
    if (Array.isArray(parsed.tags)) {
      parsed.tags = parsed.tags
        .map((t: unknown) => String(t).toLowerCase().trim())
        .filter((t: string) => t.length > 0)
        .slice(0, 25);
    } else {
      parsed.tags = [];
    }

    return NextResponse.json(parsed, { headers });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      { error: "AI Processing Failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_DRISHYA_APP_URL || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
