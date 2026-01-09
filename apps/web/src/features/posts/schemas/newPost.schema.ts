import { z } from "zod";

export const newPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export type NewPostInput = z.infer<typeof newPostSchema>;
