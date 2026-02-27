import { z } from "zod";

export const updateUserAdminSchema = z.object({
  username: z
    .string()
    .min(2, "username must be at least 2 characters")
    .max(32, "username must be at most 32 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "username can only contain alphanumeric characters, hyphens, and underscores",
    )
    .optional(),
  avatarPath: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  password: z.string().optional(),
  role: z.enum(["USER", "ADMIN", "MOD"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED", "DELETED"]).optional(),
  statusReason: z.string().optional(),
});

export type UpdateUserAdminInput = z.infer<typeof updateUserAdminSchema>;
