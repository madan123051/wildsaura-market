import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// Auto-migrate old model names
const VALID_MODELS = ["gemini-2.0-flash", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
function migrateModel(model: string | undefined): string {
  if (model && VALID_MODELS.includes(model)) return model;
  if (model?.includes("1.5-pro") || model?.includes("2.5-pro")) return "gemini-2.5-pro";
  return "gemini-2.0-flash";
}

// Get chatbot AI config from Firestore (with env fallback)
async function getChatbotConfig(): Promise<{
  apiKey: string;
  model: string;
  systemPrompt: string;
  enabled: boolean;
}> {
  try {
    const snap = await adminDb.collection("settings").doc("ai-config").get();
    if (snap.exists) {
      const data = snap.data();
      if (data?.chatbot) {
        return {
          apiKey: data.chatbot.apiKey || process.env.GEMINI_API_KEY || "",
          model: migrateModel(data.chatbot.model),
          systemPrompt:
            data.chatbot.systemPrompt ||
            "You are WildSaura Market assistant. Help users find photos, understand pricing, and navigate the marketplace. Be friendly and concise.",
          enabled: data.chatbot.enabled !== false,
        };
      }
    }
  } catch (e) {
    console.warn("Could not load chatbot config from Firestore, using env fallback:", e);
  }
  // Fallback: use GEMINI_API_KEY env var if Firestore is unavailable
  return {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: "gemini-2.0-flash",
    systemPrompt:
      "You are WildSaura Market assistant. Help users find photos, understand pricing, and navigate the marketplace. Be friendly and concise.",
    enabled: true,
  };
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const config = await getChatbotConfig();
    if (!config.enabled) {
      return NextResponse.json(
        { error: "Chatbot is currently disabled. Admin can enable it in AI Settings." },
        { status: 503 }
      );
    }

    if (!config.apiKey) {
      return NextResponse.json(
        { error: "Chatbot AI API key not configured. Please set it in Admin → AI Settings, or add GEMINI_API_KEY to environment variables." },
        { status: 500 }
      );
    }

    // Build marketplace context
    const marketContext = `
${config.systemPrompt}

MARKETPLACE INFO:
- WildSaura is a Nepali stock photography marketplace
- Photographers upload nature, wildlife, landscape, street, culture, macro, aerial, underwater & adventure photos
- Photos are reviewed by AI and admin before approval
- Prices are in NPR (Nepali Rupees)
- Categories: nature, wildlife, landscape, street, culture, macro, aerial, underwater, adventure
- Photographers earn from each sale
- Buyers can purchase and download high-quality photos
- Payment via eSewa

IMPORTANT RULES:
- Be helpful, friendly, and concise
- Answer in the same language the user writes in
- If you don't know something specific about a listing, say so honestly
- Never make up photo URLs or specific listings
- Guide users to browse the marketplace for specific photos
- Keep responses under 200 words unless more detail is needed
    `;

    // Build chat history for Gemini REST API format
    const chatContents = [
      // System context as first user message + model acknowledgment
      { role: "user", parts: [{ text: marketContext }] },
      {
        role: "model",
        parts: [
          {
            text: "Understood! I'm WildSaura Market assistant. I'll help users with photos, pricing, categories, and marketplace navigation. How can I help?",
          },
        ],
      },
      // Previous chat history
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
      // Current message
      { role: "user", parts: [{ text: message }] },
    ];

    // ─── Direct REST API call (no SDK dependency) ─────────────────────
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

    const geminiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: chatContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `Gemini API error: ${geminiResponse.status}`;
      console.error("Chatbot Gemini API Error:", errorMsg);
      return NextResponse.json(
        { error: "Chatbot failed to respond", details: errorMsg },
        { status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: "AI returned empty response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Chatbot Error:", error);
    return NextResponse.json(
      {
        error: "Chatbot failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
