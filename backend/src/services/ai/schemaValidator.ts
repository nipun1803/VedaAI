import { z } from "zod";
import type { GeneratedPaperPayload, GeneratedQuestion } from "@/types/assessment.js";
import { AppError } from "@/utils/AppError.js";

const generatedQuestionSchema = z.object({
  question: z.string().min(5),
  difficulty: z.enum(["easy", "medium", "hard"]),
  marks: z.number().int().min(1),
  type: z.enum(["MCQ", "Short Answer", "Long Answer", "True/False"]),
  options: z.array(z.string()).optional(),
  answer: z.string().optional()
});

const generatedPaperSchema = z.object({
  title: z.string().min(3),
  sections: z
    .array(
      z.object({
        name: z.string().min(1),
        instruction: z.string().min(1),
        questions: z.array(generatedQuestionSchema).min(1)
      })
    )
    .min(1)
});

export function validateGeneratedPaper(payload: unknown): GeneratedPaperPayload {
  const parsed = generatedPaperSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError("AI output failed schema validation", 502, "AI_SCHEMA_INVALID", parsed.error.flatten());
  }

  return {
    ...parsed.data,
    sections: parsed.data.sections.map((section) => ({
      ...section,
      questions: section.questions.map(normalizeQuestion)
    }))
  };
}

function normalizeQuestion(question: GeneratedQuestion): GeneratedQuestion {
  return {
    ...question,
    question: question.question.trim(),
    answer: question.answer?.trim(),
    options: question.options?.map((option) => option.trim()).filter(Boolean)
  };
}

