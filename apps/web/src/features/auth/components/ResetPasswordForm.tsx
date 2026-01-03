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
      }
    );
  }

  if (isValidToken === false) {
    return (
      <div className="space-y-4 w-full max-w-sm">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="font-semibold text-red-900">Invalid Reset Link</h3>
          <p className="text-sm text-red-800 mt-2">
            {tokenError || "The password reset link is invalid or has expired."}
          </p>
        </div>
        <Link href="/auth/forgot-password">
          <Button className="w-full">Request New Reset Link</Button>
        </Link>
        <Link href="/auth/login">
          <Button variant="outline" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    );
  }

  if (isValidToken === null) {
    return (
      <div className="flex justify-center items-center w-full max-w-sm h-64">
        <p className="text-gray-500">Validating reset link...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full max-w-sm"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" type="password" {...field} />
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
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={resetMutation.isPending || !isValid}
        >
          {resetMutation.isPending ? "Resetting..." : "Reset Password"}
        </Button>

        <div className="text-center text-sm">
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </form>
    </Form>
  );
}
