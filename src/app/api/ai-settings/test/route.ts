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
    // Verify admin
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
        error: `Invalid model: "${cleanModel}". Use one of: ${VALID_MODELS.join(", ")}`,
      });
    }

    // Use DIRECT REST API call — bypasses SDK version issues completely
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey.trim()}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: "Say hello in one word." }],
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return NextResponse.json({ valid: true, message: `✅ Working! Model: ${cleanModel}` });
      }
      return NextResponse.json({ valid: true, message: `✅ API key is valid! (Model: ${cleanModel})` });
    }

    // Handle error responses
    const errorData = await response.json().catch(() => null);
    const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
    const errorStatus = errorData?.error?.status || "";

    if (response.status === 400 && errorMsg.includes("API_KEY_INVALID")) {
      return NextResponse.json({ valid: false, error: "❌ API key is invalid. Get a new key from aistudio.google.com/apikey" });
    }
    if (response.status === 403) {
      return NextResponse.json({ valid: false, error: "❌ Permission denied. Enable 'Generative Language API' in Google Cloud Console." });
    }
    if (response.status === 404) {
      return NextResponse.json({ valid: false, error: `❌ Model '${cleanModel}' not found. Try 'gemini-2.0-flash'.` });
    }
    if (response.status === 429) {
      return NextResponse.json({ valid: true, message: "✅ API key is valid! (Rate limit reached, but key works)" });
    }

    return NextResponse.json({ valid: false, error: `❌ Error: ${errorMsg} (${errorStatus || response.status})` });
  } catch (error: unknown) {
    console.error("API Key Test Error:", error);
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED")) {
      return NextResponse.json({ valid: false, error: "❌ Network error. Could not reach Google API." });
    }

    return NextResponse.json({ valid: false, error: `❌ Error: ${msg.substring(0, 200)}` });
  }
}
