import { z } from "zod";

// Full schema for form validation (includes confirmPassword)
export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(1, "New password is required"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
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
