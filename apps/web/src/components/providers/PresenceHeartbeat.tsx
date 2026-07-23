"use client";

import { useEffect } from "react";
import { api } from "@/lib/kyClient";

/** Align with API Session lastUsedAt touch (~30s) and ACTIVE_NOW_WINDOW_MS. */
const HEARTBEAT_MS = 45_000;

/**
 * Pings POST /presence/heartbeat so guests appear in admin "Active now".
 * Logged-in users are skipped server-side (Session.lastUsedAt).
 */
export function PresenceHeartbeat() {
  useEffect(() => {
    let cancelled = false;

    const ping = () => {
      if (cancelled) return;
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      void api.post("presence/heartbeat").catch(() => {
        // Presence is best-effort — ignore network/throttle errors.
      });
    };

    ping();
    const id = window.setInterval(ping, HEARTBEAT_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
