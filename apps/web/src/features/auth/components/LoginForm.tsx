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
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { toast } from "sonner";

export default function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const {
    formState: { isValid },
  } = form;
  const loginMutation = useLogin();
  const { captureEvent } = usePostHogEvents();

  function onSubmit(data: LoginInput) {
    loginMutation.mutate(data, {
      onError: (e) => {
        toast.error(String(e));
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
            src="/favicon.ico"
            alt="Monno"
            className="w-12 h-12 rounded-lg"
          />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Monno</h1>
        <p className="text-sm text-muted-foreground">Log in to your account</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3">
        <a
          href={`${apiUrl}/auth/google`}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-input rounded-lg hover:bg-accent transition-colors font-medium"
        >
          <FcGoogle className="w-5 h-5" />
          Google
        </a>

        <a
          href={`${apiUrl}/auth/github`}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-input rounded-lg hover:bg-accent transition-colors font-medium"
        >
          <FaGithub className="w-5 h-5" />
          GitHub
        </a>
      </div>

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
