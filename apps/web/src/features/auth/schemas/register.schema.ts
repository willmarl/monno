import { z } from "zod";

export const registerSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    email: z.union([z.string().email(), z.literal("")]).optional(),
    password: z.string().min(1, "Password must be filled in"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
