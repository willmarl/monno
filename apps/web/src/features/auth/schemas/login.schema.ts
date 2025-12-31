import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1),
  email: z.email().optional(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
