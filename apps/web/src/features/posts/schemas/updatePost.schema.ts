import { z } from "zod";

export const updatePostSchema = z.object({
  title: z.string(),
  content: z.string(),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;
