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
import { Lock, LogOut, Globe } from "lucide-react";
import { InlinePasswordForm } from "@/features/users/components/InlinePasswordForm";
import { toastSuccess, toastError } from "@/lib/toast";
import { SessionManager } from "@/features/auth/components/SessionManager";

export function SecurityTab() {
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
    </div>
  );
}
