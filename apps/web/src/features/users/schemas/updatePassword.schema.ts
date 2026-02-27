import { z } from "zod";

// Full schema for form validation (includes confirmPassword)
export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(128),
    newPassword: z.string().min(1, "New password is required").max(128),
    confirmPassword: z.string().min(1, "Please confirm your password").max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Type for API submission (only current and new password)
export type UpdatePasswordInput = {
  currentPassword: string;
  newPassword: string;
};
