"use client";

import { CreateTicket } from "../../pages/admin/support/modal/CreateTicket";
import { useModal } from "@/components/providers/ModalProvider";

export default function Footer() {
  const { openModal } = useModal();

  return (
    <footer className="bg-sidebar text-sidebar-foreground text-center p-4">
      <p>&copy; {new Date().getFullYear()} Footer here</p>
      <button
        className="cursor-pointer hover:underline bg-transparent border-none p-0"
        onClick={() => {
          openModal({
            title: "Create new user",
            content: <CreateTicket />,
          });
        }}
      >
        Contact
      </button>
    </footer>
  );
}
