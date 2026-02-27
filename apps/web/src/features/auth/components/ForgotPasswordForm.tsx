"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRequestPasswordReset } from "../hooks";
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
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(256, "email must be at most 256 characters"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const {
    formState: { isValid },
  } = form;

  const resetMutation = useRequestPasswordReset();
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(data: ForgotPasswordInput) {
    resetMutation.mutate(data.email, {
      onSuccess: () => {
        toast.success("Check your email for password reset instructions");
        setSubmitted(true);
        form.reset();
      },
      onError: () => {
        toast.error("Failed to send reset email");
      },
    });
  }

  if (submitted) {
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

        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 space-y-2">
          <h3 className="font-semibold text-green-700 dark:text-green-400">
            Check your email
          </h3>
          <p className="text-sm text-muted-foreground">
            If an account exists with that email, we've sent a password reset
            link. It expires in 1 hour.
          </p>
        </div>
        <Link href="/login" className="block">
          <Button
            variant="outline"
            className="w-full h-10 font-semibold cursor-pointer"
          >
            Back to Login
          </Button>
        </Link>
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="your@email.com"
                    type="email"
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
            {resetMutation.isPending ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </Form>

      {/* Info text */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send you a link to reset your password.
          <br />
          If you just signed up with username and password only, you're out of
          luck :/
        </p>
      </div>

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
