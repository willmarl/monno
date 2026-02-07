import { z } from "zod";

export const newCollectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).optional(),
});

export type NewCollectionInput = z.infer<typeof newCollectionSchema>;
