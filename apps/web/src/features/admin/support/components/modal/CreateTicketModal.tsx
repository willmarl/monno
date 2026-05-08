import { CreateTicketForm } from "@/features/support/components/CreateTicketForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function CreateTicketModal() {
  const { closeModal } = useModal();

  return (
    <CreateTicketForm
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
