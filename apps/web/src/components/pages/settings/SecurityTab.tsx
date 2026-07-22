"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Trash2 } from "lucide-react";
import { PasswordForm } from "@/features/users/components/PasswordForm";
import { toastSuccess, toastError } from "@/lib/toast";
import { SessionManager } from "@/features/auth/components/SessionManager";
import { useDeleteProfile } from "@/features/users/hooks";
import { DeleteAccountModal } from "@/features/users/components/DeleteAccountModal";
import { useModal } from "@/components/providers/ModalProvider";

export function SecurityTab() {
  const deleteProfile = useDeleteProfile();
  const { openModal, closeModal } = useModal();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm
            onSuccess={() => {
              toastSuccess("Password changed successfully");
            }}
            onCancel={() => {}}
            onError={(err) => {
              toastError(String(err));
            }}
            isAlwaysOpen={true}
          />
        </CardContent>
      </Card>

      <Card>
        <SessionManager showGeolocation={true} showRiskScore={true} />
      </Card>

      <Card className="border-destructive/30 bg-destructive/5 dark:border-destructive/50 dark:bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription className="text-destructive/80 dark:text-destructive/70">
            Soft-delete your account. You must confirm with your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            onClick={() => {
              openModal({
                title: "Delete Account",
                content: (
                  <DeleteAccountModal
                    isPending={deleteProfile.isPending}
                    onConfirm={(password) => {
                      deleteProfile.mutate(password, {
                        onSuccess: () => {
                          closeModal();
                          window.location.href = "/login";
                        },
                        onError: (err) => {
                          toastError(String(err));
                        },
                      });
                    }}
                  />
                ),
              });
            }}
            disabled={deleteProfile.isPending}
          >
            {deleteProfile.isPending ? "Deleting..." : "Delete Account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
