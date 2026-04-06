import { z } from "zod";

export const editCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export type EditCommentInput = z.infer<typeof editCommentSchema>;
