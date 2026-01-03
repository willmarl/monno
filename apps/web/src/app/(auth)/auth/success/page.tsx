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
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Authenticating...</h1>
        <p className="text-gray-600">Redirecting you back home</p>
      </div>
    </div>
  );
}
