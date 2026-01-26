import { z } from "zod";

export const createUserAdminSchema = z.object({
  username: z.string().min(2).max(32),
  avatarPath: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  password: z.string().min(1).max(128),
  role: z.enum(["USER", "ADMIN", "MOD"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED", "DELETED"]).optional(),
  statusReason: z.string().optional(),
});

export type CreateUserAdminInput = z.infer<typeof createUserAdminSchema>;
