import RegisterForm from "@/features/auth/components/RegisterForm";
import { Card } from "@/components/ui/card";

export default async function RegisterPage() {
  return (
    <div className="flex justify-center mt-20">
      <Card className="p-8 w-full max-w-md">
        <RegisterForm />
      </Card>
    </div>
  );
}
