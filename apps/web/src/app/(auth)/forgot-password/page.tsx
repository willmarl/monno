import { redirectIfLoggedIn } from "@/features/auth/server";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";
import { Card } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
};
async function ForgotPasswordPage() {
  await redirectIfLoggedIn();

  return (
    <div className="flex justify-center mt-20">
      <Card className="p-8 w-full max-w-md">
        <ForgotPasswordForm />
      </Card>
    </div>
  );
}

export default ForgotPasswordPage;
