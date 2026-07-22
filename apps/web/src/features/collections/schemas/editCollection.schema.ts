import { z } from "zod";
import { visibilitySchema } from "./newCollection.schema";

export const editCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  visibility: visibilitySchema.optional(),
});

export type EditCollectionInput = z.infer<typeof editCollectionSchema>;
