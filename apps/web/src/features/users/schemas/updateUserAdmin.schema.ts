import { z } from "zod";

export const updateUserAdminSchema = z.object({
  username: z.string().max(32).optional(),
  avatarPath: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  password: z.string().optional(),
});

export type UpdateUserAdminInput = z.infer<typeof updateUserAdminSchema>;
