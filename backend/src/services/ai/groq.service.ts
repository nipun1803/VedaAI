import Groq from "groq-sdk";
import { env } from "@/config/env.js";
import type { AssignmentDocument } from "@/models/Assignment.model.js";
import type { Types } from "mongoose";
import { AiLogModel } from "@/models/AiLog.model.js";
import { buildQuestionPaperPrompt } from "@/services/ai/promptBuilder.js";
import { parseJsonFromAiResponse } from "@/services/ai/responseParser.js";
import { validateGeneratedPaper } from "@/services/ai/schemaValidator.js";
import type { GeneratedPaperPayload } from "@/types/assessment.js";
import { AppError } from "@/utils/AppError.js";

let groqClient: Groq | null = null;

function getGroqClient() {
  if (!groqClient) {
    if (!env.GROQ_API_KEY) {
      throw new AppError(
        "GROQ_API_KEY is not configured",
        500,
        "AI_NOT_CONFIGURED"
      );
    }

    groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
  }

  return groqClient;
}

export async function generateQuestionPaperWithGroq(
  assignment: AssignmentDocument & { _id: Types.ObjectId }
): Promise<GeneratedPaperPayload> {
  const prompt = buildQuestionPaperPrompt(assignment);
  const maxRetries = env.AI_MAX_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const startTime = Date.now();
    let rawResponse = "";

    try {
      const client = getGroqClient();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);

      try {
        const completion = await client.chat.completions.create(
          {
            model: env.GROQ_MODEL,
            messages: [
              {
                role: "system",
                content:
                  "You are VedaAI, an expert school assessment designer. Respond ONLY with valid JSON. No markdown, no prose, no commentary."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 8192,
            top_p: 0.95,
            response_format: { type: "json_object" }
          },
          { signal: controller.signal }
        );

        rawResponse = completion.choices[0]?.message?.content ?? "";
        const latencyMs = Date.now() - startTime;

        const parsed = parseJsonFromAiResponse(rawResponse);
        const validated = validateGeneratedPaper(parsed);

        await AiLogModel.create({
          assignmentId: assignment._id,
          model: env.GROQ_MODEL,
          prompt,
          rawResponse,
          parsedOutput: validated,
          tokenUsage: {
            promptTokens: completion.usage?.prompt_tokens,
            completionTokens: completion.usage?.completion_tokens,
            totalTokens: completion.usage?.total_tokens
          },
          latencyMs,
          status: "success"
        });

        return validated;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      lastError = error instanceof Error ? error : new Error(String(error));

      await AiLogModel.create({
        assignmentId: assignment._id,
        model: env.GROQ_MODEL,
        prompt,
        rawResponse: rawResponse || undefined,
        latencyMs,
        status: "failed",
        error: lastError.message
      }).catch(() => {
        // Swallow logging errors to avoid masking the real failure.
      });

      if (attempt < maxRetries) {
        const backoffMs = Math.min(2000 * 2 ** attempt, 10000);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }
    }
  }

  throw new AppError(
    lastError?.message ?? "AI question generation failed after all retries",
    502,
    "AI_GENERATION_FAILED"
  );
}
