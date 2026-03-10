import { z } from "zod";

export const updateCollectionAdminSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
});

export type UpdateCollectionAdminInput = z.infer<
  typeof updateCollectionAdminSchema
>;
