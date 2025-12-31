import { z } from "zod";

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
