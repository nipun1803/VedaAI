import { z } from "zod";

const questionTypeSchema = z.enum(["MCQ", "Short Answer", "Long Answer", "True/False"]);

export const assignmentBodySchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    subject: z.string().trim().min(2).max(80),
    grade: z.string().trim().min(1).max(40),
    dueDate: z.string().min(1),
    fileName: z.string().optional(),
    fileContext: z.string().optional(),
    questionConfigs: z
      .array(
        z.object({
          id: z.string().optional(),
          type: questionTypeSchema,
          count: z.coerce.number().int().min(1).max(50),
          marks: z.coerce.number().int().min(1).max(25)
        })
      )
      .min(1),
    difficultyDistribution: z.object({
      easy: z.coerce.number().int().min(0).max(100),
      medium: z.coerce.number().int().min(0).max(100),
      hard: z.coerce.number().int().min(0).max(100)
    }),
    instructions: z.string().max(1200).optional()
  })
  .refine(
    (value) =>
      value.difficultyDistribution.easy +
        value.difficultyDistribution.medium +
        value.difficultyDistribution.hard ===
      100,
    {
      path: ["difficultyDistribution"],
      message: "Difficulty distribution must total 100"
    }
  );

export type AssignmentBody = z.infer<typeof assignmentBodySchema>;

