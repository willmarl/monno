import { z } from "zod";

export const updatePostSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().min(1).max(1000),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;
