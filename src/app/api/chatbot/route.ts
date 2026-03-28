import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// Helper: Get chatbot AI config from Firestore
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
          apiKey: data.chatbot.apiKey || "",
          model: data.chatbot.model || "gemini-2.0-flash",
          systemPrompt:
            data.chatbot.systemPrompt ||
            "You are WildSaura Market assistant. Help users find photos, understand pricing, and navigate the marketplace. Be friendly and concise.",
          enabled: Boolean(data.chatbot.enabled),
        };
      }
    }
  } catch (e) {
    console.warn("Could not load chatbot config:", e);
  }
  return { apiKey: "", model: "gemini-2.0-flash", systemPrompt: "", enabled: false };
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
        { error: "Chatbot AI API key not configured. Please set it in Admin → AI Settings." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({ model: config.model });

    // Build context with marketplace info
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

    // Build chat history
    const chatHistory = (history || []).map(
      (msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })
    );

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: marketContext }] },
        {
          role: "model",
          parts: [
            {
              text: "Understood! I'm WildSaura Market assistant. I'll help users with photos, pricing, categories, and marketplace navigation. How can I help?",
            },
          ],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Chatbot Error:", error);
    return NextResponse.json(
      {
        error: "Chatbot failed to respond",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
