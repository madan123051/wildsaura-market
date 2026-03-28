import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import { adminDb } from "@/lib/firebaseAdmin";

// ==============================
// 1. GET CONFIG FROM ADMIN DASHBOARD (Firestore)
// ==============================
async function getAIConfig(): Promise<{ apiKey: string; analysisModel: string; textModel: string }> {
  try {
    const snap = await adminDb.collection("settings").doc("ai-config").get();
    if (snap.exists) {
      const data = snap.data();
      if (data?.photoAnalysis?.apiKey && data.photoAnalysis.enabled) {
        return {
          apiKey: data.photoAnalysis.apiKey,
          analysisModel: "gemini-2.5-pro",  // Pro for deep image analysis
          textModel: data.photoAnalysis.model || "gemini-2.0-flash",  // Flash for metadata
        };
      }
    }
  } catch (e) {
    console.warn("Could not load AI settings from Firestore, using env fallback:", e);
  }
  return {
    apiKey: process.env.GEMINI_API_KEY || "",
    analysisModel: "gemini-2.5-pro",
    textModel: "gemini-2.0-flash",
  };
}


// ==============================
// 2. HELPER: CONVERT IMAGE TO BASE64
// ==============================
function fileToGenerativePart(path: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}


// ==============================
// 3. MAIN ANALYSIS FUNCTION
// ==============================
export async function analyzeStockPhoto(imagePath: string) {
  try {
    // Get API key & models from Admin Dashboard (Firestore)
    const config = await getAIConfig();
    if (!config.apiKey) {
      throw new Error("AI API key not configured. Please set it in Admin → AI Settings.");
    }

    const genAI = new GoogleGenerativeAI(config.apiKey);
    const imageAnalyzer = genAI.getGenerativeModel({ model: config.analysisModel });
    const textGenerator = genAI.getGenerativeModel({ model: config.textModel });

    const imagePart = fileToGenerativePart(imagePath, "image/jpeg");

    // --- STEP 1: DEEP ANALYSIS (using 2.5 Pro) ---
    // This prompt is critical for Shutterstock-level detail.
    const deepAnalysisPrompt = `Analyze this image in extreme detail for stock photography purposes. Identify every object, texture, lighting style, composition technique (e.g., rule of thirds, macro), mood, the main subject's action, and background context. Mention any visible text, specific branding, or potential model release requirements. Describe the technical quality and resolution of the content shown.`;

    const analysisResult = await imageAnalyzer.generateContent([deepAnalysisPrompt, imagePart]);
    const deepAnalysisText = analysisResult.response.text();
    console.log("Deep Analysis Complete...");

    // --- STEP 2: METADATA GENERATION (using 2.0 Flash) ---
    // This prompt is optimized to parse analysis into perfect, ready-to-use metadata.
    const metadataPrompt = `Based on this deep analysis: '${deepAnalysisText}', generate stock photography metadata in a structured JSON format. 

Follow these strict rules:
1. "Title": Must be 60-150 characters, descriptive, no spammy words.
2. "Description": A full sentence caption of the image (under 250 chars).
3. "Keywords": Exactly 50 distinct, relevant tags, comma-separated (e.g., 'nature, macro, bee, honey, floral...'). No irrelevant buzzwords like 'best photo'.
4. "Categories": Two most relevant Shutterstock categories (e.g., 'Nature', 'Animals/Wildlife').
5. "ModelReleaseRequired": 'Yes' or 'No' based on analysis of people's faces.
6. "PropertyReleaseRequired": 'Yes' or 'No' based on analysis of private property/branding.

Output only the JSON.`;

    const metadataResult = await textGenerator.generateContent(metadataPrompt);
    const finalMetadata = JSON.parse(metadataResult.response.text());
    
    // finalMetadata object is now ready for your database/marketplace.
    return finalMetadata;

  } catch (error) {
    console.error("Analysis/Generation Error:", error);
    throw error; 
  }
}
