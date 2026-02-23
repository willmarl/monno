import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  email: z.union([z.string().email(), z.literal("")]).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
