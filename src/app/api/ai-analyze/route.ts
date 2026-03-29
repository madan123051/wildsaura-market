import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { extractAndRepairJSON } from "@/lib/json-repair";

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

// Auto-migrate old/deprecated model names to valid current ones
const VALID_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash-lite"];
function migrateModel(model: string | undefined): string {
  if (model && VALID_MODELS.includes(model)) return model;
  if (model === "gemini-2.0-flash" || model?.includes("2.0-flash")) return "gemini-2.5-flash";
  if (model?.includes("1.5-pro") || model?.includes("2.5-pro")) return "gemini-2.5-pro";
  if (model?.includes("1.5-flash")) return "gemini-2.5-flash";
  return "gemini-2.5-flash";
}

// Get AI API key from Firestore settings (fallback to env)
async function getPhotoAnalysisConfig(): Promise<{ apiKey: string; model: string }> {
  try {
    const snap = await adminDb.collection("settings").doc("ai-config").get();
    if (snap.exists) {
      const data = snap.data();
      if (data?.photoAnalysis?.apiKey && data.photoAnalysis.enabled) {
        return {
          apiKey: data.photoAnalysis.apiKey,
          model: migrateModel(data.photoAnalysis.model),
        };
      }
    }
  } catch (e) {
    console.warn("Could not load AI settings from Firestore, using env fallback:", e);
  }
  return {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: "gemini-2.5-flash",
  };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_DRISHYA_APP_URL || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Extract text from Gemini response, skipping "thinking" parts (Gemini 2.5)
function extractTextFromGeminiResponse(geminiData: Record<string, unknown>): string {
  const candidates = geminiData?.candidates as Array<Record<string, unknown>> | undefined;
  const parts = (candidates?.[0] as Record<string, unknown>)?.content as Record<string, unknown> | undefined;
  const partsArray = parts?.parts as Array<Record<string, unknown>> | undefined;
  
  if (!partsArray || partsArray.length === 0) return "";
  
  // Get non-thought text parts
  const textParts = partsArray.filter(
    (p) => typeof p.text === "string" && p.text.trim() && !p.thought
  );
  
  if (textParts.length > 0) {
    return textParts.map((p) => p.text as string).join("");
  }
  
  // Fallback: any text part
  const anyText = partsArray.find((p) => typeof p.text === "string" && p.text.trim());
  return (anyText?.text as string) || "";
}

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "imageUrl is required and must be a string" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Get API key from Firestore (admin-managed) or fallback to env
    const config = await getPhotoAnalysisConfig();
    if (!config.apiKey) {
      return NextResponse.json(
        { error: "AI API key not configured. Please set it in Admin → AI Settings." },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Fetch the image and convert to base64
    const imageResp = await fetch(imageUrl);
    if (!imageResp.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${imageResp.status}` },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    const imageBuffer = await imageResp.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    const extension = imageUrl.split(".").pop()?.split("?")[0]?.toLowerCase();
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      gif: "image/gif", webp: "image/webp",
    };
    const mimeType = mimeMap[extension || ""] || "image/jpeg";

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
        "title": "Short 5-10 word title",
        "description": "Brief 1-2 sentence description under 200 chars",
        "tags": ["tag1", "tag2", "tag3"],
        "category": "nature",
        "quality_score": 8,
        "market_demand": "High"
      }

      If NOT marketable:
      {
        "is_marketable": false,
        "rejection_reason": "Reason in 1-2 short sentences",
        "title": "",
        "description": "",
        "tags": [],
        "category": "nature",
        "quality_score": 2,
        "market_demand": "Low"
      }

      CRITICAL RULES:
      - Return ONLY valid JSON, nothing else
      - Keep ALL strings SHORT (under 200 chars each)
      - tags array: max 20 short single-word tags
      - category: exactly one of: nature, wildlife, landscape, street, culture, macro, aerial, underwater, adventure
      - quality_score: integer 1-10
      - market_demand: "High", "Medium", or "Low"
    `;

    // Direct REST API call
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

    const geminiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      const errorMsg = (errorData as Record<string, Record<string, string>>)?.error?.message || `Gemini API error: ${geminiResponse.status}`;
      console.error("Gemini API Error:", errorMsg);
      return NextResponse.json(
        { error: "AI analysis failed: " + errorMsg },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const geminiData = await geminiResponse.json();
    
    // Extract text, skipping thinking parts (Gemini 2.5 feature)
    const text = extractTextFromGeminiResponse(geminiData as Record<string, unknown>);

    if (!text) {
      console.error("Empty AI response. Raw data:", JSON.stringify(geminiData).substring(0, 500));
      return NextResponse.json(
        { error: "AI returned empty response" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    console.log("Raw AI text (first 300 chars):", text.substring(0, 300));

    // Use robust JSON repair (handles markdown blocks, unterminated strings, etc.)
    const repairedJSON = extractAndRepairJSON(text);
    const parsed = JSON.parse(repairedJSON);

    // Normalize and validate fields
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

    return NextResponse.json(parsed, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      { error: "AI analysis failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
