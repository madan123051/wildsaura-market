import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

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
        photoAnalysisModel: data?.photoAnalysis?.model ?? "missing",
        hasChatbot: !!data?.chatbot,
        chatbotEnabled: data?.chatbot?.enabled ?? "missing",
        chatbotHasKey: !!data?.chatbot?.apiKey,
        chatbotModel: data?.chatbot?.model ?? "missing",
      };
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
      hint: "Set FIREBASE_SERVICE_ACCOUNT_JSON env var in Vercel with the full service account JSON",
    };
  }

  // 2. Check which auth method is being used
  const hasServiceAccountJson = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const hasIndividualVars = !!(process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID);
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  (results as Record<string, unknown>).envVars = {
    hasServiceAccountJson,
    hasIndividualVars,
    hasGeminiApiKeyEnv: hasGeminiKey,
    authMethod: hasServiceAccountJson ? "FIREBASE_SERVICE_ACCOUNT_JSON (recommended)" : hasIndividualVars ? "Individual env vars (fallback)" : "NONE — no credentials found!",
  };

  return NextResponse.json(results, { status: 200 });
}
