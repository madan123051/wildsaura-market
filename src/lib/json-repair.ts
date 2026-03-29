/**
 * Robust JSON repair utility for Gemini 2.5 responses
 * Handles: markdown blocks, unterminated strings, unclosed brackets, trailing commas
 */

export function extractAndRepairJSON(raw: string): string {
  let text = raw.trim();

  // 1. Strip markdown code blocks
  text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // 2. Try to extract JSON object/array from surrounding text
  const jsonStart = text.indexOf("{");
  const jsonArrayStart = text.indexOf("[");
  
  if (jsonStart === -1 && jsonArrayStart === -1) {
    throw new Error("No JSON found in response");
  }

  // Pick whichever comes first
  const startIdx = jsonStart === -1 ? jsonArrayStart :
                   jsonArrayStart === -1 ? jsonStart :
                   Math.min(jsonStart, jsonArrayStart);
  const isArray = text[startIdx] === "[";

  text = text.substring(startIdx);

  // 3. Try direct parse first
  try {
    return JSON.stringify(JSON.parse(text));
  } catch (_) {
    // Continue to repair
  }

  // 4. Fix unterminated strings by finding open quotes
  text = fixUnterminatedStrings(text);

  // 5. Remove trailing commas before } or ]
  text = text.replace(/,\s*([}\]])/g, "$1");

  // 6. Close unclosed brackets/braces
  text = closeBrackets(text, isArray);

  // 7. Final parse attempt
  try {
    return JSON.stringify(JSON.parse(text));
  } catch (e) {
    // One more attempt: truncate at last valid closing bracket
    const lastBrace = text.lastIndexOf(isArray ? "]" : "}");
    if (lastBrace > 0) {
      const truncated = text.substring(0, lastBrace + 1);
      try {
        return JSON.stringify(JSON.parse(truncated));
      } catch (_) {}
    }
    throw e;
  }
}

function fixUnterminatedStrings(text: string): string {
  let inString = false;
  let escaped = false;
  const chars = text.split("");
  const result: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    if (escaped) {
      escaped = false;
      result.push(ch);
      continue;
    }

    if (ch === "\\" && inString) {
      escaped = true;
      result.push(ch);
      continue;
    }

    if (ch === '"') {
      if (inString) {
        inString = false;
        result.push(ch);
      } else {
        inString = true;
        result.push(ch);
      }
      continue;
    }

    if (inString && (ch === "\n" || ch === "\r")) {
      // Newline inside string — close the string
      result.push('"');
      inString = false;
      result.push(ch);
      continue;
    }

    result.push(ch);
  }

  // If string is still open at the end, close it
  if (inString) {
    result.push('"');
  }

  return result.join("");
}

function closeBrackets(text: string, isArray: boolean): string {
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (const ch of text) {
    if (escaped) { escaped = false; continue; }
    if (ch === "\\" && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") openBraces++;
    if (ch === "}") openBraces--;
    if (ch === "[") openBrackets++;
    if (ch === "]") openBrackets--;
  }

  // Remove trailing commas
  text = text.replace(/,\s*$/, "");

  // Close unclosed brackets/braces
  while (openBraces > 0) { text += "}"; openBraces--; }
  while (openBrackets > 0) { text += "]"; openBrackets--; }

  return text;
}
