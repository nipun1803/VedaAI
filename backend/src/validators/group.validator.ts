import { z } from "zod";

export const groupBodySchema = z.object({
  name: z.string().trim().min(3).max(100),
  studentsCount: z.coerce.number().int().min(0).max(500).optional().default(0)
});

export type GroupBody = z.infer<typeof groupBodySchema>;
