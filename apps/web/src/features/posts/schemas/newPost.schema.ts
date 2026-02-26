import { z } from "zod";

export const newPostSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().min(1).max(1000),
});

export type NewPostInput = z.infer<typeof newPostSchema>;
