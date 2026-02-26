import { z } from "zod";

export const updateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(2000).optional(),
});

export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
