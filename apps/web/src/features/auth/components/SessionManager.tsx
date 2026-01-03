"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";
import {
  useSessions,
  useRevokeSession,
  useLogoutAll,
} from "@/features/auth/hooks";

export function SessionManager() {
  const [mounted, setMounted] = useState(false);
  const {
    data: sessions = [],
    isLoading: loading,
    error,
    refetch,
  } = useSessions();
  const { mutate: revokeSessionMutate, isPending } = useRevokeSession();
  const { mutate: logoutAllMutate, isPending: isLoggingOutAll } =
    useLogoutAll();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRevoke = (sessionId: string) => {
    revokeSessionMutate(sessionId);
  };

  const isRevoking = (sessionId: string) => isPending;

  if (!mounted) {
    return null;
  }

  const parseUserAgent = (ua: string) => {
    // Simple user agent parsing
    if (ua === "unknown") return "Unknown Device";

    // Check for common browsers and OS
    if (ua.includes("Chrome")) {
      if (ua.includes("Windows")) return "Chrome on Windows";
      if (ua.includes("Mac")) return "Chrome on macOS";
      if (ua.includes("Linux")) return "Chrome on Linux";
    }
    if (ua.includes("Safari") && !ua.includes("Chrome")) {
      if (ua.includes("Mac")) return "Safari on macOS";
      if (ua.includes("iPhone")) return "Safari on iPhone";
      if (ua.includes("iPad")) return "Safari on iPad";
    }
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Edge")) return "Microsoft Edge";

    return ua.substring(0, 50) + "...";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading sessions...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Active Sessions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your devices and active login sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => logoutAllMutate()}
            disabled={isLoggingOutAll || sessions.length === 0}
          >
            {isLoggingOutAll ? "Logging out..." : "Logout All"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          {error instanceof Error ? error.message : "Failed to load sessions"}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-muted border border-muted-foreground/20 rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No active sessions found</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="border border-border rounded-lg p-4 flex items-start justify-between hover:bg-accent transition"
            >
              <div className="flex-1">
                <h3 className="font-medium text-foreground">
                  {parseUserAgent(session.userAgent)}
                </h3>
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  <p>IP Address: {session.ipAddress || "Unknown"}</p>
                  <p>Signed in: {formatDate(session.createdAt)}</p>
                  <p>Last active: {formatDate(session.lastUsedAt)}</p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRevoke(session.id)}
                disabled={isPending}
                className="ml-4"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isPending ? "Revoking..." : "Revoke"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm text-primary">
        <p className="font-medium">Tip:</p>
        <p className="mt-1">
          Revoking a session will immediately log you out on that device. You
          can log in again if needed.
        </p>
      </div>
    </div>
  );
}
