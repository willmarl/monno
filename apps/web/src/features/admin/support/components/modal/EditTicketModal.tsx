import { EditTicketAdminForm } from "@/features/admin/support/components/EditTicketAdminForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { SupportTicket } from "@/features/support/types/support";

export function EditTicketModal({ ticket }: { ticket: SupportTicket }) {
  const { closeModal } = useModal();

  return (
    <EditTicketAdminForm
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
