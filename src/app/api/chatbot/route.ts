import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// Auto-migrate old/deprecated model names
const VALID_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash-lite"];
function migrateModel(model: string | undefined): string {
  if (model && VALID_MODELS.includes(model)) return model;
  if (model === "gemini-2.0-flash" || model?.includes("2.0-flash")) return "gemini-2.5-flash";
  if (model?.includes("1.5-pro") || model?.includes("2.5-pro")) return "gemini-2.5-pro";
  if (model?.includes("1.5-flash")) return "gemini-2.5-flash";
  return "gemini-2.5-flash";
}

/**
 * Extract text from Gemini response — handles both regular and "thinking" model responses.
 * Gemini 2.5 models may return [{thought: true, text: "..."}, {text: "actual answer"}]
 * We want the LAST non-thought text part.
 */
function extractTextFromGeminiResponse(geminiData: Record<string, unknown>): string | null {
  try {
    const candidate = (geminiData?.candidates as Array<Record<string, unknown>>)?.[0];
    if (!candidate) return null;

    // Check if blocked by safety
    if (candidate.finishReason === "SAFETY" || candidate.finishReason === "BLOCKED") {
      return "I'm sorry, I can't respond to that. Please try a different question.";
    }

    const parts = (candidate.content as Record<string, unknown>)?.parts as Array<Record<string, unknown>>;
    if (!parts || parts.length === 0) return null;

    // Find the last non-thought text part (Gemini 2.5 thinking models)
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (part.text && !part.thought) {
        return part.text as string;
      }
    }

    // Fallback: just get any text part
    for (const part of parts) {
      if (part.text) return part.text as string;
    }

    return null;
  } catch {
    return null;
  }
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
  return {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: "gemini-2.5-flash",
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
      { role: "user", parts: [{ text: marketContext }] },
      {
        role: "model",
        parts: [
          {
            text: "Understood! I'm WildSaura Market assistant. I'll help users with photos, pricing, categories, and marketplace navigation. How can I help?",
          },
        ],
      },
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    // Direct REST API call
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
      const errorMsg = (errorData as Record<string, Record<string, string>>)?.error?.message || `Gemini API error: ${geminiResponse.status}`;
      console.error("Chatbot Gemini API Error:", errorMsg, "Model:", config.model);
      return NextResponse.json(
        { error: "Chatbot failed to respond", details: errorMsg },
        { status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();
    const text = extractTextFromGeminiResponse(geminiData as Record<string, unknown>);

    if (!text) {
      // Log the full response for debugging
      console.error("Chatbot: Empty response from Gemini.", "Model:", config.model, "Response structure:", JSON.stringify({
        hasCandidates: !!(geminiData as Record<string, unknown>)?.candidates,
        candidateCount: ((geminiData as Record<string, unknown>)?.candidates as unknown[])?.length ?? 0,
        finishReason: ((geminiData as Record<string, unknown>)?.candidates as Record<string, unknown>[])?.[0]?.finishReason,
        partsCount: (((geminiData as Record<string, unknown>)?.candidates as Record<string, unknown>[])?.[0]?.content as Record<string, unknown>)?.parts ? ((((geminiData as Record<string, unknown>)?.candidates as Record<string, unknown>[])?.[0]?.content as Record<string, unknown>)?.parts as unknown[])?.length : 0,
      }));
      return NextResponse.json(
        { error: "AI returned empty response", debug: { model: config.model, finishReason: ((geminiData as Record<string, unknown>)?.candidates as Record<string, unknown>[])?.[0]?.finishReason || "unknown" } },
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
