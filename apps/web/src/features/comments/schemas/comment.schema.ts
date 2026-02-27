import { z } from "zod";

export const commentSchema = z.object({
  resourceType: z.enum(["POST", "VIDEO", "ARTICLE", "COMMENT"]).optional(),
  resourceId: z.number().int().optional(),
  content: z.string().min(1).max(2000),
});

export type CommentInput = z.infer<typeof commentSchema>;
