import { z } from "zod";

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(2, "username must be at least 2 characters")
    .max(32, "username must be at most 32 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "username can only contain alphanumeric characters, hyphens, and underscores",
    ),
  // .optional(),
  email: z
    .union([
      z
        .string()
        .email("invalid email address")
        .max(256, "email must be at most 256 characters"),
      z.literal(""),
    ])
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
