"use client";

import { useSessionUser } from "@/features/auth/hooks";
import { useModal } from "@/components/providers/ModalProvider";
import { Button } from "@/components/ui/button";

export default function page() {
  const { data: user } = useSessionUser();

  if (user) {
    return <div>user account</div>;
  } else {
    return <div>guest</div>;
  }
}
