import { z } from "zod";

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(2, "username must be at least 2 characters")
      .max(32, "username must be at most 32 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "username can only contain alphanumeric characters, hyphens, and underscores",
      ),
    email: z
      .union([
        z
          .string()
          .email("invalid email address")
          .max(256, "email must be at most 256 characters"),
        z.literal(""),
      ])
      .optional(),
    password: z
      .string()
      .min(1, "Password must be filled in")
      .max(128, "password must be at most 128 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password")
      .max(128, "password must be at most 128 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
