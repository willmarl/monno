"use client";

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

  // Reminder to fix issue Input component is receiving a value prop that changes between undefined and a string
  function onSubmit(data: RegisterInput) {
    const payload = {
      ...data,
      email: data.email || undefined,
    };
    registerMutation.mutate(payload);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full max-w-sm"
      >
        {/* username */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>

              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>

              <FormDescription>
                What your friends will call you.
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
              <FormLabel>Password</FormLabel>

              <FormControl>
                <Input placeholder="password" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending || !isValid}
        >
          {registerMutation.isPending ? "Loading..." : "Create account"}
        </Button>
      </form>
      {/* OAuth Buttons */}
      <div className="space-y-3">
        <a
          href={`${apiUrl}/auth/google`}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <FcGoogle className="w-5 h-5" />
          Google
        </a>

        <a
          href={`${apiUrl}/auth/github`}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <FaGithub className="w-5 h-5" />
          GitHub
        </a>
      </div>
    </Form>
  );
}
