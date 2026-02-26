import { z } from "zod";

export const newCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(2000).optional(),
});

export type NewCollectionInput = z.infer<typeof newCollectionSchema>;
