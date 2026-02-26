import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, "Password must be filled in")
      .max(128, "password must be at most 128 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password")
      .max(128, "password must be at most 128 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
