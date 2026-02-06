import { z } from "zod";

export const updateCollectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
