import { z } from "zod";

export const editCollectionAdminSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
});

export type EditCollectionAdminInput = z.infer<typeof editCollectionAdminSchema>;
