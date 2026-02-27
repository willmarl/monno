"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTicketSchema,
  CreateTicketInput,
} from "../schemas/createTicket.schema";
import { useCreateSupportTicket } from "../hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface InlineCreateTicketFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
}

export function InlineCreateTicketForm({
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
}: InlineCreateTicketFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      message: "",
      title: "",
    },
  });

  const createTicketMutation = useCreateSupportTicket();

  const { isValid } = form.formState;

  const handleSubmit = (data: CreateTicketInput) => {
    // Filter out empty strings
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== ""),
    ) as CreateTicketInput;

    createTicketMutation.mutate(filteredData, {
      onSuccess: () => {
        form.reset();
        if (!isAlwaysOpen) {
          setIsOpen(false);
        }
        onSuccess?.();
      },
      onError: (err) => {
        onError?.(err);
      },
    });
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Change CreateTicket
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* title */}
      <div className="space-y-2">
        <Label htmlFor="inline-title" className="text-sm">
          Title
        </Label>
        <Input
          id="inline-title"
          type="text"
          placeholder="title"
          disabled={createTicketMutation.isPending}
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* message */}
      <div className="space-y-2">
        <Label htmlFor="inline-message" className="text-sm">
          Message
        </Label>
        <Input
          id="inline-message"
          type="text"
          placeholder="message"
          disabled={createTicketMutation.isPending}
          {...form.register("message")}
        />
        {form.formState.errors.message && (
          <p className="text-xs text-red-500">
            {form.formState.errors.message.message}
          </p>
        )}
      </div>

      {/* email */}
      <div className="space-y-2">
        <Label htmlFor="inline-email" className="text-sm">
          Email (optional)
        </Label>
        <Input
          id="inline-email"
          type="text"
          placeholder="email"
          disabled={createTicketMutation.isPending}
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-red-500">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            if (!isAlwaysOpen) {
              setIsOpen(false);
            }
            form.reset();
            onCancel?.();
          }}
          disabled={createTicketMutation.isPending}
        >
          {isAlwaysOpen ? "Clear" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={createTicketMutation.isPending || !isValid}
        >
          {createTicketMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {createTicketMutation.isPending ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </form>
  );
}
