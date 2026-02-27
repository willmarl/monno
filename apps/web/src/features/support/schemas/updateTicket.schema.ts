import { z } from "zod";

export const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "CLOSED", "RESPONDED"]),
  adminNotes: z.string().max(100).optional(),
});

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
