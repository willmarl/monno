import { Suspense } from "react";
import { VerifyEmailClient } from "./verify-email-client";
import { Card } from "@/components/ui/card";

function VerifyEmailFallback() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="p-8 max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <img
            src="/favicon.ico"
            alt="Monno"
            className="w-12 h-12 rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Monno</h1>
          <p className="text-sm text-muted-foreground">Verify your email</p>
        </div>
        <p className="text-muted-foreground">
          Please wait while we verify your email address.
        </p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailClient />
    </Suspense>
  );
}
