import { z } from "zod";
import { visibilitySchema } from "./createPost.schema";

export const updatePostSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().min(1).max(1000),
  visibility: visibilitySchema.optional(),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;
