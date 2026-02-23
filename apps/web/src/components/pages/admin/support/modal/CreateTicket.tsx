import { InlineCreateTicketForm } from "@/features/support/components/InlineCreateTicketForm";
import { useModal } from "@/components/modal/ModalProvider";
import { toast } from "sonner";

export function CreateTicket() {
  const { closeModal } = useModal();

  return (
    <InlineCreateTicketForm
      onSuccess={() => {
        toast.success("Successfully sent message");
        closeModal();
      }}
      onCancel={() => {
        toast.error("Error trying to send message");
      }}
      isAlwaysOpen={true}
    />
  );
}
