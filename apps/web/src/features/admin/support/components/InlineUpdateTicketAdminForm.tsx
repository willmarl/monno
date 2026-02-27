"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateTicketSchema,
  UpdateTicketInput,
} from "../schemas/updateTicketAdmin.schema";
import { useUpdateSupportTicket } from "../../../support/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { SupportTicket } from "../../../support/types/support";

interface InlineUpdateTicketFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;

  isAlwaysOpen?: boolean;
  ticket: SupportTicket;
}

export function InlineUpdateTicketForm({
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
  ticket,
}: InlineUpdateTicketFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<UpdateTicketInput>({
    resolver: zodResolver(updateTicketSchema),
    mode: "onChange",
    defaultValues: {
      status: ticket.status,
      adminNotes: ticket.adminNotes,
    },
  });

  const updateTicketMutation = useUpdateSupportTicket();

  const { isValid } = form.formState;

  const handleSubmit = (data: UpdateTicketInput) => {
    // Filter out empty strings and undefined values
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== ""),
    ) as UpdateTicketInput;
    updateTicketMutation.mutate(
      { id: ticket.id, data: filteredData },
      {
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
      },
    );
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Change UpdateTicket
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="inline-status" className="text-sm">
          Status
        </Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="inline-status"
                disabled={updateTicketMutation.isPending}
              >
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">OPEN</SelectItem>
                <SelectItem value="CLOSED">CLOSED</SelectItem>
                <SelectItem value="RESPONDED">RESPONDED</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.status && (
          <p className="text-xs text-red-500">
            {form.formState.errors.status.message}
          </p>
        )}
      </div>

      {/* adminNotes */}
      <div className="space-y-2">
        <Label htmlFor="inline-adminNotes" className="text-sm">
          Admin Notes
        </Label>
        <Textarea
          id="inline-adminNotes"
          placeholder="Admin notes (optional)"
          disabled={updateTicketMutation.isPending}
          {...form.register("adminNotes")}
        />
        {form.formState.errors.adminNotes && (
          <p className="text-xs text-red-500">
            {form.formState.errors.adminNotes.message}
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
          disabled={updateTicketMutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={updateTicketMutation.isPending || !isValid}
          className="cursor-pointer"
        >
          {updateTicketMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {updateTicketMutation.isPending ? "Updating..." : "Update"}
        </Button>
      </div>
    </form>
  );
}
