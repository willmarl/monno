import { z } from "zod";

export const editPostSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().min(1).max(1000),
});

export type EditPostInput = z.infer<typeof editPostSchema>;
