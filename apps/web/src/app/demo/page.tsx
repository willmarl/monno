"use client";

import { useModal } from "@/components/providers/ModalProvider";
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
            title: "Confirm Action",
            content: (
              <div>
                <p className="my-40">Foo</p>
                <p className="my-40">Foo</p>
                <p className="my-40">Foo</p>
                <p className="my-40">Foo</p>
                <p className="my-40">Foo</p>
                <p className="my-40">Foo</p>
                <Button variant={"outline"} onClick={handleClick}>
                  Yes
                </Button>
                <Button onClick={closeModal}>No</Button>
              </div>
            ),
          });
        }}
      >
        Click me to open modal
      </Button>
    </div>
  );
}
