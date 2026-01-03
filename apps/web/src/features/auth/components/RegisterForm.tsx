"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "../schemas/register.schema";
import { useRegister } from "../hooks";
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
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

export default function RegisterForm() {
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const {
    formState: { isValid },
  } = form;
  const registerMutation = useRegister();

  function onSubmit(data: RegisterInput) {
    // Only send username, email, and password to backend
    // confirmPassword is only for frontend validation
    const payload = {
      username: data.username,
      email: data.email || undefined,
      password: data.password,
    };
    registerMutation.mutate(payload);
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
        <p className="text-sm text-muted-foreground">Create your account</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

                <FormDescription>
                  What your friends will call you.
                </FormDescription>

                <FormMessage />
              </FormItem>
            )}
          />

          {/* email */}
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

          {/* password */}
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

          {/* confirm password */}
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
            className="w-full h-10 font-semibold"
            disabled={registerMutation.isPending || !isValid}
          >
            {registerMutation.isPending
              ? "Creating account..."
              : "Create account"}
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

      {/* Login link */}
      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary font-semibold hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
