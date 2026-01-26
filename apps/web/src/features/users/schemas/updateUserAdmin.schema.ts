import { z } from "zod";

export const updateUserAdminSchema = z.object({
  username: z.string().max(32).optional(),
  avatarPath: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  password: z.string().optional(),
  role: z.enum(["USER", "ADMIN", "MOD"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED", "DELETED"]).optional(),
  statusReason: z.string().optional(),
});

export type UpdateUserAdminInput = z.infer<typeof updateUserAdminSchema>;
