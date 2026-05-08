"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "../schemas/register.schema";
import { useRegister } from "../hooks";
import { usePostHogEvents } from "@/hooks/usePostHogEvents";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import OAuthButtons from "./OAuthButtons";

interface RegisterFormProps {
  onSuccess?: () => void;
  isAlwaysOpen?: boolean;
}

/**
 * Form for user registration. Importer must handle:
 * - Post-registration navigation/redirect via onSuccess callback
 *
 * isAlwaysOpen=false: renders as toggle button.
 * isAlwaysOpen=true: renders form immediately (pages/modals).
 */
export function RegisterForm({
  onSuccess,
  isAlwaysOpen = false,
}: RegisterFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    formState: { isValid },
  } = form;
  const registerMutation = useRegister();
  const { captureEvent } = usePostHogEvents();

  function onSubmit(data: RegisterInput) {
    const payload = {
      username: data.username,
      password: data.password,
      ...(data.email && { email: data.email }),
    };
    registerMutation.mutate(payload, {
      onSuccess: () => {
        captureEvent("signup_completed", {
          username: data.username,
          hasEmail: !!data.email,
        });
        if (!isAlwaysOpen) setIsOpen(false);
        onSuccess?.();
      },
      onError: (err) => {
        const errorMessage = String(err);
        form.setError("root", { message: errorMessage });
        toast.error(errorMessage);
      },
    });
  }

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Register
      </Button>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <img
            src="/favicon.svg"
            alt="Monno"
            className="w-12 h-12 rounded-lg"
          />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Monno</h1>
        <p className="text-sm text-muted-foreground">Create your account</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {form.formState.errors.root && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
              <p className="text-sm text-destructive font-medium">
                {form.formState.errors.root.message}
              </p>
            </div>
          )}

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">
                  Username
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your username"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email (optional)"
                    {...field}
                    value={field.value || ""}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription>
                  We'll use this to help you recover your account.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">
                  Password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
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
                    type="password"
                    placeholder="Confirm your password"
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
            disabled={registerMutation.isPending || !isValid}
          >
            {registerMutation.isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Form>

      <div role="separator" aria-label="Or continue with" className="relative">
        <hr className="border-border" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="px-2 bg-background text-sm text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <OAuthButtons />

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
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
