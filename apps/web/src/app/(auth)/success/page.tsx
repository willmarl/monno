"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * OAuth Success Handler
 *
 * This page is called after OAuth callback from the backend.
 * By the time we reach here, the backend has:
 * - Exchanged OAuth code for tokens
 * - Created/merged user account
 * - Created session
 * - Set cookies (accessToken, refreshToken, sessionId)
 *
 * All we need to do is redirect to home since cookies are already set.
 */
export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Cookies are already set by backend, just redirect to home
    router.push("/");
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <img
            src="/favicon.ico"
            alt="Monno"
            className="w-12 h-12 rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Monno</h1>
          <p className="text-sm text-muted-foreground">Authenticating...</p>
        </div>
        <p className="text-muted-foreground">Redirecting you back home</p>
        <div className="flex justify-center pt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
}
