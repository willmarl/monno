import { z } from "zod";

export const editTicketAdminSchema = z.object({
  status: z.enum(["OPEN", "CLOSED", "RESPONDED"]),
  adminNotes: z.string().max(100).optional(),
});

export type EditTicketAdminInput = z.infer<typeof editTicketAdminSchema>;
