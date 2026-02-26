"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useResetPassword } from "../hooks";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  resetPasswordSchema,
  ResetPasswordInput,
} from "../schemas/resetPassword.schema";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string>("");

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setTokenError("No reset token provided");
      return;
    }

    // Token format validation (basic check - server will validate properly)
    if (token.length < 20) {
      setIsValidToken(false);
      setTokenError("Invalid reset link");
      return;
    }

    setIsValidToken(true);
  }, [token]);

  const {
    formState: { isValid },
  } = form;
  const resetMutation = useResetPassword();

  function onSubmit(data: ResetPasswordInput) {
    if (!token) {
      toast.error("Reset token missing");
      return;
    }

    resetMutation.mutate(
      { token, newPassword: data.confirmPassword },
      {
        onSuccess: () => {
          toast.success("Password reset successfully! Redirecting to login...");
          setTimeout(() => {
            router.push("/login");
          }, 1500);
        },
        onError: (error: any) => {
          const message = error?.message || "Failed to reset password";
          toast.error(message);
          setTokenError(message);
        },
      },
    );
  }

  if (isValidToken === false) {
    return (
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src="/favicon.ico"
              alt="Monno"
              className="w-12 h-12 rounded-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Monno</h1>
          <p className="text-sm text-muted-foreground">Reset your password</p>
        </div>

        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-2">
          <h3 className="font-semibold text-destructive">Invalid Reset Link</h3>
          <p className="text-sm text-muted-foreground">
            {tokenError || "The password reset link is invalid or has expired."}
          </p>
        </div>
        <div className="space-y-3">
          <Link href="/forgot-password" className="block">
            <Button className="w-full h-10 font-semibold">
              Request New Reset Link
            </Button>
          </Link>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full h-10 font-semibold">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isValidToken === null) {
    return (
      <div className="flex justify-center items-center w-full max-w-sm h-64">
        <p className="text-muted-foreground">Validating reset link...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <img
            src="/favicon.ico"
            alt="Monno"
            className="w-12 h-12 rounded-lg"
          />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Monno</h1>
        <p className="text-sm text-muted-foreground">Reset your password</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">
                  New Password
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your new password"
                    type="password"
                    {...field}
                    className="h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Confirm your password"
                    type="password"
                    {...field}
                    className="h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-10 font-semibold cursor-pointer"
            disabled={resetMutation.isPending || !isValid}
          >
            {resetMutation.isPending ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </Form>

      {/* Back to login link */}
      <div className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-primary font-semibold hover:underline"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
