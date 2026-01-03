"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVerifyEmailToken } from "@/features/auth/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { mutateAsync: verifyEmail } = useVerifyEmailToken();
  const [verificationState, setVerificationState] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setVerificationState("error");
      setErrorMessage("No verification token provided");
      return;
    }

    const verify = async () => {
      try {
        setVerificationState("loading");
        await verifyEmail(token);

        setVerificationState("success");
        setErrorMessage("");
        // Wait for cache invalidation to complete, then redirect
        setTimeout(() => {
          router.push("/profile");
        }, 2000);
      } catch (error) {
        // Extract just the message from the error
        let errorMsg = "Failed to verify email. Please try again.";
        if (error instanceof Error) {
          errorMsg = error.message;
        }

        // Check if error indicates email was already verified (which is actually a success)
        if (
          errorMsg.toLowerCase().includes("already verified") ||
          errorMsg.toLowerCase().includes("already used")
        ) {
          setVerificationState("success");
          setErrorMessage("Email is already verified!");
          setTimeout(() => {
            router.push("/profile");
          }, 2000);
        } else {
          setVerificationState("error");
          setErrorMessage(errorMsg);
        }
      }
    };

    verify();
  }, [token, verifyEmail, router]);

  if (verificationState === "loading") {
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

  if (verificationState === "success") {
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
          <div className="mb-2 flex justify-center">
            <div className="rounded-full bg-green-500/10 p-3">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Email Verified!
            </h1>
            <p className="text-muted-foreground">
              {errorMessage ||
                "Your email has been successfully verified. You will be redirected to your profile shortly."}
            </p>
          </div>
          <Button
            onClick={() => router.push("/profile")}
            className="w-full h-10 font-semibold"
          >
            Go to Profile
          </Button>
        </Card>
      </div>
    );
  }

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
        <div className="mb-2 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <svg
              className="h-6 w-6 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-destructive">
            Verification Failed
          </h1>
          <p className="text-muted-foreground">
            {errorMessage || "The verification link is invalid or has expired."}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push("/profile")}
            variant="outline"
            className="flex-1 h-10 font-semibold"
          >
            Go to Profile
          </Button>
          <Button
            onClick={() => router.push("/")}
            className="flex-1 h-10 font-semibold"
          >
            Go Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
