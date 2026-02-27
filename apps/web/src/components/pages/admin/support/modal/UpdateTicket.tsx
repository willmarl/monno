import { InlineUpdateTicketForm } from "@/features/admin/support/components/InlineUpdateTicketForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { SupportTicket } from "@/features/support/types/support";

export function UpdateTicket({ ticket }: { ticket: SupportTicket }) {
  const { closeModal } = useModal();

  return (
    <InlineUpdateTicketForm
      ticket={ticket}
      onSuccess={() => {
        toast.success("Successfully updated ticket");
        closeModal();
      }}
      onError={() => {
        toast.error("Error trying to update ticket");
      }}
      isAlwaysOpen={true}
    />
  );
}
