import { z } from "zod";

export const adminUpdatePostSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().min(1).max(1000),
});

export type AdminUpdatePostInput = z.infer<typeof adminUpdatePostSchema>;
