import { AppError } from "@/utils/AppError.js";

export function parseJsonFromAiResponse(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new AppError("AI response did not contain valid JSON", 502, "AI_PARSE_FAILED");
  }

  const jsonSlice = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(jsonSlice) as unknown;
  } catch (error) {
    throw new AppError("AI response JSON was malformed", 502, "AI_PARSE_FAILED", String(error));
  }
}

