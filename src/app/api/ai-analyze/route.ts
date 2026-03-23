// =============================================================================
// /api/ai-analyze — Gemini 1.5 Flash Photo Analysis for WildSaura Market
// =============================================================================
// Called by Lumina (Drishya) when a user wants to sell a photo.
// Analyzes the image and returns: title, description, tags, category,
// quality_score, and market_demand.
// =============================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─── CORS (Lumina is on a different origin) ─────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/** Preflight handler */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// ─── POST /api/ai-analyze ───────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "imageUrl is required and must be a string" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Initialize Gemini 1.5 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. Professional Marketplace Prompt
    const prompt = `
You are a professional stock photography analyst for a marketplace like Shutterstock.
Analyze this image and return ONLY valid JSON (no markdown, no code blocks, no explanation).

Available categories: nature, wildlife, culture, food, architecture, people, adventure, abstract, aerial, other

Return this exact JSON structure:
{
  "title": "A descriptive 5-10 word professional title",
  "description": "A brief 2-sentence description suitable for a stock photo marketplace listing. Describe what buyers will see and potential use cases.",
  "tags": ["keyword1", "keyword2", "...up to 20 relevant SEO keywords"],
  "category": "one_of_the_categories_listed_above",
  "quality_score": 8,
  "market_demand": "High"
}

Scoring rules:
- title: Professional, descriptive, 5-10 words. No generic titles.
- description: 2 sentences — what the photo shows + potential commercial use.
- tags: Up to 20 relevant SEO keywords as an array of lowercase strings.
- category: MUST be exactly one of: nature, wildlife, culture, food, architecture, people, adventure, abstract, aerial, other
- quality_score: Integer 1-10 based on:
    * Clarity & sharpness (2 pts)
    * Composition & framing (2 pts)
    * Lighting & exposure (2 pts)
    * Commercial appeal (2 pts)
    * Uniqueness & creativity (2 pts)
- market_demand: "High", "Medium", or "Low" based on commercial viability and current trends.

Return ONLY the JSON object.`;

    // 3. Fetch image and convert to base64
    const imageResp = await fetch(imageUrl);
    if (!imageResp.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image from URL" },
        { status: 400, headers: corsHeaders }
      );
    }

    const imageBuffer = await imageResp.arrayBuffer();
    const contentType = imageResp.headers.get("content-type") || "image/jpeg";

    // 4. Send to Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: Buffer.from(imageBuffer).toString("base64"),
          mimeType: contentType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // 5. Clean and parse JSON response
    const cleanText = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const analysisResult = JSON.parse(cleanText);

    // 6. Validate & sanitize the response
    const validCategories = [
      "nature", "wildlife", "culture", "food", "architecture",
      "people", "adventure", "abstract", "aerial", "other",
    ];

    const sanitized = {
      title: String(analysisResult.title || "").slice(0, 120),
      description: String(analysisResult.description || "").slice(0, 500),
      tags: Array.isArray(analysisResult.tags)
        ? analysisResult.tags.slice(0, 20).map((t: unknown) => String(t).toLowerCase().trim())
        : [],
      category: validCategories.includes(analysisResult.category)
        ? analysisResult.category
        : "other",
      quality_score: Math.min(10, Math.max(1, Math.round(Number(analysisResult.quality_score) || 5))),
      market_demand: ["High", "Medium", "Low"].includes(analysisResult.market_demand)
        ? analysisResult.market_demand
        : "Medium",
    };

    return NextResponse.json(sanitized, { headers: corsHeaders });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      { error: "AI Processing Failed. Please try again." },
      { status: 500, headers: corsHeaders }
    );
  }
}
