import { InlineEditTicketAdminForm } from "@/features/admin/support/components/InlineEditTicketAdminForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { SupportTicket } from "@/features/support/types/support";

export function EditTicket({ ticket }: { ticket: SupportTicket }) {
  const { closeModal } = useModal();

  return (
    <InlineEditTicketAdminForm
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
