"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Lock, LogOut, Globe, Trash2 } from "lucide-react";
import { InlinePasswordForm } from "@/features/users/components/InlinePasswordForm";
import { toastSuccess, toastError } from "@/lib/toast";
import { SessionManager } from "@/features/auth/components/SessionManager";
import { useDeleteProfile } from "@/features/users/hooks";
import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { useModal } from "@/components/providers/ModalProvider";

export function SecurityTab() {
  const deleteProfile = useDeleteProfile();
  const { openModal } = useModal();
  return (
    <div className="space-y-6">
      {/* Change Password Card */}
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
          {/* The InlinePasswordForm component handles all password change logic */}
          <InlinePasswordForm
            onSuccess={() => {
              toastSuccess("Password changed successfully");
            }}
            onCancel={() => {
              // toastError("Password form cancelled");
            }}
            onError={(err) => {
              toastError(String(err));
            }}
            isAlwaysOpen={true}
          />
        </CardContent>
      </Card>

      {/* Active Sessions Card */}
      <Card>
        <SessionManager showGeolocation={true} showRiskScore={true} />
      </Card>

      {/* Delete Account Card */}
      <Card className="border-destructive/30 bg-destructive/5 dark:border-destructive/50 dark:bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription className="text-destructive/80 dark:text-destructive/70">
            Permanently delete your account and all associated data. This action
            cannot be undone.
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
                  <ConfirmModal
                    message={`Are you sure you want to permanently delete your account? This action cannot be undone.`}
                    onConfirm={() => {
                      deleteProfile.mutate(undefined, {
                        onSuccess: () => {
                          // Account deleted and cookies cleared by backend
                          // Just redirect to login
                          window.location.href = "/login";
                        },
                      });
                    }}
                    variant={"destructive"}
                    showCancelButton={true}
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
