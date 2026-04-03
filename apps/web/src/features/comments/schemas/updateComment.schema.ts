import { z } from "zod";

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
