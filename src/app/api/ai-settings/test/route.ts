import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

const ADMIN_EMAIL = "madan123050@gmail.com";

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

    const { apiKey, model } = await req.json();
    if (!apiKey) {
      return NextResponse.json({ valid: false, error: "API key is required" });
    }

    // Test the API key by making a simple generation call
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({ model: model || "gemini-2.0-flash" });

    const result = await genModel.generateContent("Say hello in one word.");
    const text = result.response.text();

    if (text) {
      return NextResponse.json({ valid: true, message: "API key is working!" });
    } else {
      return NextResponse.json({ valid: false, error: "No response from model" });
    }
  } catch (error: unknown) {
    console.error("API Key Test Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Invalid API key or model";
    
    // Parse common Gemini API errors for user-friendly messages
    if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("401")) {
      return NextResponse.json({ valid: false, error: "API key is invalid. Please check and try again." });
    }
    if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("403")) {
      return NextResponse.json({ valid: false, error: "API key does not have permission. Enable the Generative AI API." });
    }
    if (errorMessage.includes("NOT_FOUND") || errorMessage.includes("404")) {
      return NextResponse.json({ valid: false, error: "Model not found. Please check the model name." });
    }
    if (errorMessage.includes("QUOTA") || errorMessage.includes("429")) {
      return NextResponse.json({ valid: true, message: "API key is valid (quota limit reached, but key works)." });
    }

    return NextResponse.json({ valid: false, error: errorMessage });
  }
}
