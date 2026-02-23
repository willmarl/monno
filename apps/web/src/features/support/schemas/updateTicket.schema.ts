import { z } from "zod";

export const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "CLOSED", "RESPONDED"]),
  adminNotes: z.string().optional(),
});

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
