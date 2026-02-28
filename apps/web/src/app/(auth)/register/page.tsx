import RegisterForm from "@/features/auth/components/RegisterForm";
import { Card } from "@/components/ui/card";
import { redirectIfLoggedIn } from "@/features/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
};
export default async function RegisterPage() {
  await redirectIfLoggedIn();

  return (
    <div className="flex justify-center mt-20">
      <Card className="p-8 w-full max-w-md">
        <RegisterForm />
      </Card>
    </div>
  );
}
