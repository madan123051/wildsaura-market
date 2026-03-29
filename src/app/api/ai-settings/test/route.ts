import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

const ADMIN_EMAIL = "madan123050@gmail.com";

// Valid Gemini models
const VALID_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ valid: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.email !== ADMIN_EMAIL) {
      return NextResponse.json({ valid: false, error: "Forbidden" }, { status: 403 });
    }

    const { apiKey, model } = await req.json();
    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json({ valid: false, error: "API key is required" });
    }

    // Clean and validate model name
    const cleanModel = (model || "gemini-2.0-flash").trim().toLowerCase();
    
    if (!VALID_MODELS.includes(cleanModel)) {
      return NextResponse.json({ 
        valid: false, 
        error: `Invalid model: "${cleanModel}". Use one of: ${VALID_MODELS.join(", ")}` 
      });
    }

    // Test the API key by making a simple generation call
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const genModel = genAI.getGenerativeModel({ model: cleanModel });

    const result = await genModel.generateContent("Say hi in one word.");
    const text = result.response.text();

    if (text) {
      return NextResponse.json({ valid: true, message: `✅ Working! Model: ${cleanModel}` });
    } else {
      return NextResponse.json({ valid: false, error: "No response from model" });
    }
  } catch (error: unknown) {
    console.error("API Key Test Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Parse common Gemini API errors for user-friendly messages
    if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("API key not valid")) {
      return NextResponse.json({ valid: false, error: "❌ API key is invalid. Get a new key from aistudio.google.com/apikey" });
    }
    if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("403")) {
      return NextResponse.json({ valid: false, error: "❌ Permission denied. Enable 'Generative Language API' in Google Cloud Console." });
    }
    if (errorMessage.includes("models/") && errorMessage.includes("not found")) {
      return NextResponse.json({ valid: false, error: "❌ Model not found. Make sure 'Generative Language API' is enabled in your Google Cloud project." });
    }
    if (errorMessage.includes("NOT_FOUND") || errorMessage.includes("404")) {
      return NextResponse.json({ valid: false, error: "❌ API not reachable. Please enable 'Generative Language API' in Google Cloud Console for your project." });
    }
    if (errorMessage.includes("QUOTA") || errorMessage.includes("429") || errorMessage.includes("Resource has been exhausted")) {
      return NextResponse.json({ valid: true, message: "✅ API key is valid! (Rate limit hit, but key works)" });
    }
    if (errorMessage.includes("SAFETY")) {
      return NextResponse.json({ valid: true, message: "✅ API key is valid! (Safety filter triggered, but key works)" });
    }
    if (errorMessage.includes("fetch failed") || errorMessage.includes("ECONNREFUSED")) {
      return NextResponse.json({ valid: false, error: "❌ Network error. Could not reach Google API servers." });
    }

    // Return the actual error for debugging
    return NextResponse.json({ valid: false, error: `❌ Error: ${errorMessage.substring(0, 200)}` });
  }
}
