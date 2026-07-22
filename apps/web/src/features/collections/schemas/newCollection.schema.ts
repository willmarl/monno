import { z } from "zod";

export const visibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);

export const newCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  visibility: visibilitySchema.default("PRIVATE"),
});

export type NewCollectionInput = z.infer<typeof newCollectionSchema>;
