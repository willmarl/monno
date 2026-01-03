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
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
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
      <div className="space-y-4 w-full max-w-sm">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="font-semibold text-green-900">Check your email</h3>
          <p className="text-sm text-green-800 mt-2">
            If an account exists with that email, we've sent a password reset
            link. It expires in 1 hour.
          </p>
        </div>
        <Link href="/auth/login">
          <Button variant="outline" className="w-full">
            Back to Login
          </Button>
        </Link>
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
          <h2 className="text-2xl font-bold">Forgot Password?</h2>
          <p className="text-sm text-gray-600">
            Enter your email and we'll send you a link to reset your password.
            <br></br>
            If you just signed up with username and password only, your out of
            luck :/
          </p>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" type="email" {...field} />
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
          {resetMutation.isPending ? "Sending..." : "Send Reset Link"}
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
