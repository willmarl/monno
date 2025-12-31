import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(1),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
