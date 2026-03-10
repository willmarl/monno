import { z } from "zod";

export const updateCommentAdminSchema = z.object({
  content: z.string().min(1).max(2000),
});

export type UpdateCommentAdminInput = z.infer<typeof updateCommentAdminSchema>;
