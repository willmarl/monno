import { z } from "zod";

export const commentSchema = z.object({
  resourceType: z.enum(["POST", "VIDEO", "ARTICLE", "COMMENT"]),
  resourceId: z.number().int(),
  content: z.string().min(1).max(2000),
});

export type CommentInput = z.infer<typeof commentSchema>;
