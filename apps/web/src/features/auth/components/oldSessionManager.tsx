"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";
import { useSessions, useRevokeSession } from "@/features/auth/hooks";

export function SessionManager() {
  const [mounted, setMounted] = useState(false);
  const {
    data: sessions = [],
    isLoading: loading,
    error,
    refetch,
  } = useSessions();
  const { mutate: revokeSessionMutate, isPending } = useRevokeSession();

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

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore < 20) return "bg-green-100 text-green-800";
    if (riskScore < 50) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore < 20) return "Low Risk";
    if (riskScore < 50) return "Medium Risk";
    return "High Risk";
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Active Sessions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your devices and active login sessions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error instanceof Error ? error.message : "Failed to load sessions"}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No active sessions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="border border-gray-200 rounded-lg p-4 flex items-start justify-between hover:bg-gray-50 transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">
                    {parseUserAgent(session.userAgent)}
                  </h3>
                  {session.riskScore !== undefined && session.riskScore > 0 && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getRiskBadgeColor(
                        session.riskScore
                      )}`}
                    >
                      {getRiskLabel(session.riskScore)}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1 mt-2">
                  <p>IP Address: {session.ipAddress || "Unknown"}</p>
                  {session.location && <p>📍 Location: {session.location}</p>}
                  {session.isNewLocation && (
                    <p className="text-amber-600 font-medium">
                      ⚠️ New location detected
                    </p>
                  )}
                  {session.isNewDevice && (
                    <p className="text-amber-600 font-medium">
                      ⚠️ New device detected
                    </p>
                  )}
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-medium">Tip:</p>
        <p className="mt-1">
          Revoking a session will immediately log you out on that device. You
          can log in again if needed.
        </p>
      </div>
    </div>
  );
}
