import LoginForm from "@/features/auth/components/LoginForm";
import { Card } from "@/components/ui/card";

async function LoginPage() {
  return (
    <div className="flex justify-center mt-20">
      <Card className="p-8 w-full max-w-md">
        <LoginForm />
      </Card>
    </div>
  );
}

export default LoginPage;
