"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/providers/ModalProvider";

export function AuthModal({
  title = "Please log in to continue",
  showLoginButton = true,
  showRegisterButton = true,
  loginButtonMessage = "Login",
  registerButtonMessage = "Sign Up",
}: {
  title?: string;
  showLoginButton?: boolean;
  showRegisterButton?: boolean;
  loginButtonMessage?: string;
  registerButtonMessage?: string;
}) {
  const router = useRouter();
  const { closeModal } = useModal();

  return (
    <div className="flex flex-col space-y-6 items-center text-center">
      <h2 className="text-2xl font-bold">{title}</h2>

      <div className="flex flex-col gap-3 w-full">
        {showRegisterButton && (
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              router.push("/register");
              closeModal();
            }}
          >
            {registerButtonMessage}
          </Button>
        )}
        {showLoginButton && (
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              router.push("/login");
              closeModal();
            }}
          >
            {loginButtonMessage}
          </Button>
        )}
      </div>
    </div>
  );
}
