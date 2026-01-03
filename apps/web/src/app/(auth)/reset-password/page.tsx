import { redirectIfLoggedIn } from "@/features/auth/server";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";
import { Card } from "@/components/ui/card";

async function ResetPasswordPage() {
  await redirectIfLoggedIn();

  return (
    <div className="flex justify-center mt-20">
      <Card className="p-8 w-full max-w-md">
        <ResetPasswordForm />
      </Card>
    </div>
  );
}

export default ResetPasswordPage;
