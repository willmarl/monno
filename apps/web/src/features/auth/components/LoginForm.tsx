"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "../schemas/login.schema";
import { useLogin } from "../hooks";
import { usePostHogEvents } from "@/hooks/usePostHogEvents";
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
import { toast } from "sonner";
import OAuthButtons from "./OAuthButtons";

export default function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const {
    formState: { isValid },
  } = form;
  const loginMutation = useLogin();
  const { captureEvent } = usePostHogEvents();

  function onSubmit(data: LoginInput) {
    loginMutation.mutate(data, {
      onError: (e) => {
        const errorMessage = String(e);
        form.setError("root", {
          message: errorMessage,
        });
        toast.error(errorMessage);
      },
    });

    // Track login attempt
    captureEvent("login_attempted", {
      username: data.username,
    });
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <img
            src="/favicon.svg"
            alt="Invare"
            className="w-12 h-12 rounded-lg"
          />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Invare</h1>
        <p className="text-sm text-muted-foreground">Log in to your account</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Error alert */}
          {form.formState.errors.root && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
              <p className="text-sm text-destructive font-medium">
                {form.formState.errors.root.message}
              </p>
            </div>
          )}

          {/* username */}
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

          {/* password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-semibold">
                    Password
                  </FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

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

          <Button
            type="submit"
            className="w-full h-10 font-semibold cursor-pointer"
            disabled={loginMutation.isPending || !isValid}
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Form>

      {/* Divider */}
      <div role="separator" aria-label="Or continue with" className="relative">
        <hr className="border-border" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="px-2 bg-background text-sm text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <OAuthButtons />

      {/* Sign up link */}
      <div className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="text-primary font-semibold hover:underline"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
