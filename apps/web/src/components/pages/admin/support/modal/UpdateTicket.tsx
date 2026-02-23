import { InlineUpdateTicketForm } from "@/features/support/components/InlineUpdateTicketForm";
import { useModal } from "@/components/modal/ModalProvider";
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
      onCancel={() => {
        toast.error("Error trying to update ticket");
      }}
      isAlwaysOpen={true}
    />
  );
}
