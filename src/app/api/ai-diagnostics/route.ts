import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

function cleanEnvValue(raw: string | undefined): string {
  if (!raw) return "";
  let val = raw.trim();
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
  return val.trim();
}

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // 1. Check Firebase Admin connection
  try {
    const snap = await adminDb.collection("settings").doc("ai-config").get();
    if (snap.exists) {
      const data = snap.data();
      results.checks = {
        firestoreConnected: true,
        documentExists: true,
        hasPhotoAnalysis: !!data?.photoAnalysis,
        photoAnalysisEnabled: data?.photoAnalysis?.enabled ?? "missing",
        photoAnalysisHasKey: !!data?.photoAnalysis?.apiKey,
        photoAnalysisKeyLength: data?.photoAnalysis?.apiKey?.length ?? 0,
        photoAnalysisModel: data?.photoAnalysis?.model ?? "missing",
        hasChatbot: !!data?.chatbot,
        chatbotEnabled: data?.chatbot?.enabled ?? "missing",
        chatbotHasKey: !!data?.chatbot?.apiKey,
        chatbotKeyLength: data?.chatbot?.apiKey?.length ?? 0,
        chatbotModel: data?.chatbot?.model ?? "missing",
        hasContentModeration: !!data?.contentModeration,
        hasSeoOptimization: !!data?.seoOptimization,
        allTopLevelKeys: Object.keys(data || {}),
      };

      // 2. Test Gemini API with Photo Analysis key
      if (data?.photoAnalysis?.apiKey) {
        try {
          const model = data.photoAnalysis.model || "gemini-2.5-flash";
          const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${data.photoAnalysis.apiKey}`;
          const testResp = await fetch(testUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Say hello in one word" }] }],
              generationConfig: { maxOutputTokens: 10 },
            }),
          });
          const testData = await testResp.json();
          (results.checks as Record<string, unknown>).geminiApiTest = testResp.ok
            ? { status: "success", response: testData?.candidates?.[0]?.content?.parts?.[0]?.text }
            : { status: "failed", error: testData?.error?.message, httpStatus: testResp.status };
        } catch (e) {
          (results.checks as Record<string, unknown>).geminiApiTest = {
            status: "error",
            message: e instanceof Error ? e.message : "Unknown",
          };
        }
      } else {
        (results.checks as Record<string, unknown>).geminiApiTest = "skipped - no API key found";
      }
    } else {
      results.checks = {
        firestoreConnected: true,
        documentExists: false,
        message: "Document settings/ai-config does NOT exist. Save settings in Admin Dashboard first!",
      };
    }
  } catch (e) {
    results.checks = {
      firestoreConnected: false,
      error: e instanceof Error ? e.message : "Unknown error",
      hint: "Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env vars in Vercel",
    };
  }

  // 3. Check env vars (with detailed debug info)
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";
  const rawProjectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
  const rawClientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "";

  (results as Record<string, unknown>).envVars = {
    hasFirebaseProjectId: !!rawProjectId,
    hasFirebaseClientEmail: !!rawClientEmail,
    hasFirebasePrivateKey: !!rawKey,
    hasGeminiApiKeyEnv: !!process.env.GEMINI_API_KEY,
    // Debug: check if values have wrapping quotes (common Vercel mistake)
    projectIdDebug: {
      raw: rawProjectId.substring(0, 3) + "..." + rawProjectId.substring(rawProjectId.length - 3),
      length: rawProjectId.length,
      hasWrappingQuotes: (rawProjectId.startsWith('"') && rawProjectId.endsWith('"')) || (rawProjectId.startsWith("'") && rawProjectId.endsWith("'")),
      cleaned: cleanEnvValue(rawProjectId),
    },
    clientEmailDebug: {
      length: rawClientEmail.length,
      hasWrappingQuotes: (rawClientEmail.startsWith('"') && rawClientEmail.endsWith('"')) || (rawClientEmail.startsWith("'") && rawClientEmail.endsWith("'")),
    },
    privateKeyDebug: rawKey
      ? {
          length: rawKey.length,
          startsWithQuote: rawKey.startsWith('"') || rawKey.startsWith("'"),
          endsWithQuote: rawKey.endsWith('"') || rawKey.endsWith("'"),
          hasPemHeader: rawKey.includes("-----BEGIN"),
          hasLiteralNewlines: rawKey.includes("\\n"),
          hasRealNewlines: rawKey.includes("\n"),
          first20: rawKey.substring(0, 20).replace(/[A-Za-z0-9+/=]/g, "*"),
          last20: rawKey.substring(rawKey.length - 20).replace(/[A-Za-z0-9+/=]/g, "*"),
        }
      : "not set",
  };

  return NextResponse.json(results, { status: 200 });
}
