"use client";

import { useModal } from "@/components/modal/ModalProvider";
import { ModifyCollectionItemModal } from "@/components/modal/ModifyCollectionItemModal";
import { Button } from "@/components/ui/button";

export default function page() {
  const { openModal, closeModal } = useModal();

  function handleClick(): void {
    alert("clicked!");
    closeModal();
  }

  return (
    <div>
      <div>demo page</div>
      <Button
        onClick={() => {
          openModal({
            title: "TEST",
            content: <ModifyCollectionItemModal postId={1} />,
          });
        }}
      >
        Click me to open modal
      </Button>
    </div>
  );
}
