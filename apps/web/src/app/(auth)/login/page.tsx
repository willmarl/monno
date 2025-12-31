import LoginForm from "@/features/auth/components/LoginForm";
import { Card } from "@/components/ui/card";
import { redirectIfLoggedIn } from "@/features/auth/server";

async function LoginPage() {
  await redirectIfLoggedIn();

  return (
    <div className="flex justify-center mt-20">
      <Card className="p-8 w-full max-w-md">
        <LoginForm />
      </Card>
    </div>
  );
}

export default LoginPage;
