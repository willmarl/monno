import { z } from "zod";

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(1),
  confirmPassword: z.string().min(1),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
