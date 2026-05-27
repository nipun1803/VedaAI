import { z } from "zod";

export const questionTypes = ["MCQ", "Short Answer", "Long Answer", "True/False"] as const;

export const assignmentSchema = z
  .object({
    title: z.string().trim().min(3, "Assignment title is required"),
    subject: z.string().trim().min(2, "Subject is required"),
    grade: z.string().trim().min(1, "Class / grade is required"),
    dueDate: z.string().min(1, "Due date is required"),
    fileName: z.string().optional(),
    questionConfigs: z
      .array(
        z.object({
          id: z.string(),
          type: z.enum(questionTypes),
          count: z.coerce.number().int().min(1, "At least one question is required").max(50),
          marks: z.coerce.number().int().min(1, "Marks must be positive").max(25)
        })
      )
      .min(1, "Add at least one question type"),
    difficultyDistribution: z.object({
      easy: z.coerce.number().int().min(0).max(100),
      medium: z.coerce.number().int().min(0).max(100),
      hard: z.coerce.number().int().min(0).max(100)
    }),
    instructions: z.string().max(1200, "Keep instructions under 1200 characters").optional()
  })
  .refine(
    (value) =>
      value.difficultyDistribution.easy +
        value.difficultyDistribution.medium +
        value.difficultyDistribution.hard ===
      100,
    {
      message: "Difficulty distribution must total 100%",
      path: ["difficultyDistribution"]
    }
  );

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;

