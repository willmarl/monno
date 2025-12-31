import { z } from "zod";

export const updateUserSchema = z.object({
  username: z.string().min(1),
  email: z.union([z.string().email(), z.literal("")]).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
