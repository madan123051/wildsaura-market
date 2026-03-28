import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

// Use the same API Key you have in AI Studio for the Wildsaura project
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "YOUR_API_KEY_HERE");

// ==============================
// 1. CHOOSE THE RIGHT MODELS
// ==============================
// Use 2.5 Pro for deep image understanding. Essential for Stock Photo quality.
const imageAnalyzer = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// Use 2.0 Flash for speedy response generation.
const textGenerator = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });


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
