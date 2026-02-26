"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type ModalState = {
  isOpen: boolean;
  title?: string;
  content?: ReactNode;
};

type ModalContextType = {
  openModal: (options: { title: string; content: ReactNode }) => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    content: null,
  });

  const openModal = (options: { title: string; content: ReactNode }) => {
    setModal({
      isOpen: true,
      title: options.title,
      content: options.content,
    });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}

      <Dialog open={modal.isOpen} onOpenChange={closeModal}>
        <DialogContent>
          <DialogTitle>{modal.title}</DialogTitle>
          <div className="mt-4 p-1 max-h-[calc(100vh-200px)] overflow-y-auto">
            {modal.content}
          </div>
        </DialogContent>
      </Dialog>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside ModalProvider");
  return ctx;
}
