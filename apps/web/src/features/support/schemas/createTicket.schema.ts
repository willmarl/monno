import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(2000),
  email: z.union([z.string().email().max(256), z.literal("")]).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
