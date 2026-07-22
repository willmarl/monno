import { z } from "zod";

export const visibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);

export const createPostSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().min(1).max(1000),
  visibility: visibilitySchema.default("PUBLIC"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
