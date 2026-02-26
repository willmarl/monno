import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(2, "username must be at least 2 characters")
    .max(32, "username must be at most 32 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "username can only contain alphanumeric characters, hyphens, and underscores",
    ),
  password: z
    .string()
    .min(1, "password is required")
    .max(128, "password must be at most 128 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
