import { InlineCreateTicketForm } from "@/features/support/components/InlineCreateTicketForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function CreateTicket() {
  const { closeModal } = useModal();

  return (
    <InlineCreateTicketForm
      onSuccess={() => {
        toast.success("Successfully sent message");
        closeModal();
      }}
      onError={() => {
        toast.error("Error trying to send message");
      }}
      isAlwaysOpen={true}
    />
  );
}
