import { z } from "zod";

const usernamePattern = /^[a-zA-Z0-9_-]+$/;

export const loginSchema = z.object({
  // Wire field stays `username` for API compatibility; value may be email.
  username: z
    .string()
    .trim()
    .min(2, "username or email must be at least 2 characters")
    .max(256, "username or email must be at most 256 characters")
    .refine(
      (value) => {
        if (value.includes("@")) {
          return z.string().email().safeParse(value).success;
        }
        return value.length <= 32 && usernamePattern.test(value);
      },
      {
        message:
          "Enter a valid username (letters, numbers, _ -) or email address",
      },
    ),
  password: z
    .string()
    .min(1, "password is required")
    .max(128, "password must be at most 128 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
