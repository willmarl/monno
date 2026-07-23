"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  useComposeAdminEmail,
  useEmailSettings,
  useSendTestEmail,
  useUpdateEmailSettings,
} from "@/features/admin/hooks";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { useModal } from "@/components/providers/ModalProvider";
import { ConfirmModal } from "@/components/modal/ConfirmModal";
import {
  UserSuggestPicker,
  type UserSuggestSelection,
} from "@/features/users/components/UserSuggestPicker";

const brandingSchema = z.object({
  fromName: z.string().min(1, "Required").max(80),
  fromEmail: z.string().email("Valid email required").max(254),
  supportEmail: z.string().email("Valid email required").max(254),
});

type BrandingValues = z.infer<typeof brandingSchema>;

const composeSchema = z.object({
  audience: z.enum(["user", "all"]),
  subject: z.string().min(1, "Subject required").max(200),
  body: z.string().min(1, "Message required").max(20_000),
});

type ComposeValues = z.infer<typeof composeSchema>;

export function AdminEmailSettingsPage() {
  const { data, isLoading } = useEmailSettings();
  const update = useUpdateEmailSettings();
  const test = useSendTestEmail();
  const compose = useComposeAdminEmail();
  const { openModal, closeModal } = useModal();
  const [confirmBroadcast, setConfirmBroadcast] = useState(false);
  const [recipients, setRecipients] = useState<UserSuggestSelection[]>([]);
  const [recipientError, setRecipientError] = useState<string | undefined>();

  const brandingForm = useForm<BrandingValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      fromName: "",
      fromEmail: "",
      supportEmail: "",
    },
  });

  const composeForm = useForm<ComposeValues>({
    resolver: zodResolver(composeSchema),
    defaultValues: {
      audience: "user",
      subject: "",
      body: "",
    },
  });

  const audience = composeForm.watch("audience");

  useEffect(() => {
    if (!data) return;
    brandingForm.reset({
      fromName: data.fromName,
      fromEmail: data.fromEmail,
      supportEmail: data.supportEmail,
    });
  }, [data, brandingForm]);

  useEffect(() => {
    if (audience !== "user") {
      setRecipientError(undefined);
    }
  }, [audience]);

  if (isLoading || !data) {
    return <PageLoadingState />;
  }

  const onSaveBranding = brandingForm.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(values);
      toast.success("Email settings saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    }
  });

  const onTest = async () => {
    try {
      const result = await test.mutateAsync();
      if (result.queued) {
        toast.success(`Test email queued to ${result.to}`);
      } else {
        toast.error(result.message || "Could not queue test email");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to send test");
    }
  };

  const runCompose = async (values: ComposeValues) => {
    const payload = {
      audience: values.audience,
      subject: values.subject.trim(),
      body: values.body,
      ...(values.audience === "user"
        ? { userIds: recipients.map((u) => u.id) }
        : { confirmBroadcast: true as const }),
    };

    try {
      const result = await compose.mutateAsync(payload);
      const skippedNote =
        result.skipped > 0 ? ` (${result.skipped} skipped, no email)` : "";
      toast.success(
        values.audience === "all"
          ? `Queued ${result.queued} announcement email(s)${skippedNote}`
          : `Queued ${result.queued} email(s)${skippedNote}`,
      );
      composeForm.reset({
        audience: values.audience,
        subject: "",
        body: "",
      });
      setRecipients([]);
      setConfirmBroadcast(false);
      setRecipientError(undefined);
    } catch (e: any) {
      toast.error(e?.message || "Failed to queue email");
    }
  };

  const onCompose = composeForm.handleSubmit(async (values) => {
    if (values.audience === "user") {
      if (recipients.length === 0) {
        setRecipientError("Add at least one recipient from suggestions");
        return;
      }
      setRecipientError(undefined);
      await runCompose(values);
      return;
    }

    if (!confirmBroadcast) {
      toast.error("Confirm you want to email all users");
      return;
    }

    openModal({
      title: "Send announcement to all users?",
      content: (
        <ConfirmModal
          message="This queues a one-way email to every ACTIVE user with an email on file (cap 2000). Replies are not monitored."
          variant="destructive"
          buttonMessage="Queue broadcast"
          showCancelButton
          onCancel={closeModal}
          onConfirm={async () => {
            closeModal();
            await runCompose(values);
          }}
        />
      ),
    });
  });

  return (
    <div className="w-full space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Outbound only for now — users cannot reply to these messages. Domain
          must be verified in Resend (SPF/DKIM). API key stays in env.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <Card className="min-w-[min(100%,22rem)] flex-1 basis-[22rem] space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold">From address</h2>
            <p className="text-sm text-muted-foreground">
              Company branding used on all outbound mail.
            </p>
          </div>
          <form onSubmit={onSaveBranding} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fromName">From name</Label>
              <Input id="fromName" {...brandingForm.register("fromName")} />
              {brandingForm.formState.errors.fromName && (
                <p className="text-sm text-destructive">
                  {brandingForm.formState.errors.fromName.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Source: {data.source.fromName}
                {data.source.fromName === "env"
                  ? ` (default ${data.envDefaults.fromName})`
                  : ""}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromEmail">From email</Label>
              <Input
                id="fromEmail"
                type="email"
                {...brandingForm.register("fromEmail")}
              />
              {brandingForm.formState.errors.fromEmail && (
                <p className="text-sm text-destructive">
                  {brandingForm.formState.errors.fromEmail.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Source: {data.source.fromEmail}
                {data.source.fromEmail === "env"
                  ? ` (default ${data.envDefaults.fromEmail})`
                  : ""}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support email</Label>
              <Input
                id="supportEmail"
                type="email"
                {...brandingForm.register("supportEmail")}
              />
              {brandingForm.formState.errors.supportEmail && (
                <p className="text-sm text-destructive">
                  {brandingForm.formState.errors.supportEmail.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Shown in email footers. Source: {data.source.supportEmail}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={test.isPending}
                onClick={onTest}
              >
                {test.isPending ? "Sending…" : "Send test to me"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="min-w-[min(100%,22rem)] flex-1 basis-[22rem] space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold">Compose</h2>
            <p className="text-sm text-muted-foreground">
              Message selected users (one email each) or announce to all users
              with email. One-way — no inbox for replies until you add
              Workspace/Zoho later.
            </p>
          </div>

          <form onSubmit={onCompose} className="space-y-4">
            <div className="space-y-2">
              <Label>Audience</Label>
              <RadioGroup
                value={audience}
                onValueChange={(v) =>
                  composeForm.setValue("audience", v as "user" | "all")
                }
                className="flex flex-col gap-2"
              >
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="user" id="aud-user" />
                  Selected users
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="all" id="aud-all" />
                  All ACTIVE users with email
                </label>
              </RadioGroup>
            </div>

            {audience === "user" && (
              <div className="space-y-2">
                <Label>Recipients</Label>
                <UserSuggestPicker
                  value={recipients}
                  onChange={(users) => {
                    setRecipients(users);
                    if (users.length > 0) setRecipientError(undefined);
                  }}
                  error={recipientError}
                />
              </div>
            )}

            {audience === "all" && (
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <Checkbox
                  checked={confirmBroadcast}
                  onCheckedChange={(v) => setConfirmBroadcast(v === true)}
                  className="mt-0.5"
                />
                <span>
                  I understand this emails every ACTIVE user with an address on
                  file (max 2000), and replies will not be received.
                </span>
              </label>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Update on your support ticket"
                {...composeForm.register("subject")}
              />
              {composeForm.formState.errors.subject && (
                <p className="text-sm text-destructive">
                  {composeForm.formState.errors.subject.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                rows={8}
                placeholder="Plain text — newlines are preserved. HTML is escaped."
                {...composeForm.register("body")}
              />
              {composeForm.formState.errors.body && (
                <p className="text-sm text-destructive">
                  {composeForm.formState.errors.body.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={compose.isPending}>
              {compose.isPending
                ? "Queueing…"
                : audience === "all"
                  ? "Queue announcement"
                  : "Queue message"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
