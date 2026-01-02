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

export function SecurityTab() {
  const handleLogoutSession = (sessionId: string) => {
    // TODO: Add mutation to logout specific session
    console.log("Logout session:", sessionId);
  };

  const handleLogoutAllSessions = () => {
    // TODO: Add mutation to logout all sessions
    console.log("Logout all sessions");
  };

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
              toastError("Password form cancelled");
            }}
            isAlwaysOpen={true}
          />
        </CardContent>
      </Card>

      {/* Active Sessions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage your active sessions and devices
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutAllSessions}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Session Item 1 */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <p className="font-medium">Chrome on macOS</p>
                <p className="text-sm text-muted-foreground">
                  Last active: 2 hours ago
                </p>
                <p className="text-xs text-muted-foreground">IP: 192.168.1.1</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Current</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLogoutSession("session-1")}
                >
                  Logout
                </Button>
              </div>
            </div>

            {/* Session Item 2 */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <p className="font-medium">Safari on iPhone</p>
                <p className="text-sm text-muted-foreground">
                  Last active: 1 day ago
                </p>
                <p className="text-xs text-muted-foreground">IP: 192.168.1.2</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLogoutSession("session-2")}
              >
                Logout
              </Button>
            </div>

            {/* Session Item 3 */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <p className="font-medium">Firefox on Linux</p>
                <p className="text-sm text-muted-foreground">
                  Last active: 3 days ago
                </p>
                <p className="text-xs text-muted-foreground">IP: 192.168.1.3</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLogoutSession("session-3")}
              >
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
