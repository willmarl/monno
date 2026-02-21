"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionUser } from "@/features/auth/hooks";

/**
 * Checkout Success Handler
 *
 * This page is called after Stripe checkout is completed.
 * By the time we reach here, the backend webhook has:
 * - Processed the payment
 * - Updated subscription or credits in the database
 *
 * We refetch user data to ensure UI reflects the purchase, then redirect home.
 */
export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { refetch } = useSessionUser();

  useEffect(() => {
    // Refetch user data to get updated subscription/credits
    refetch().then(() => {
      // Give user a moment to see success, then redirect
      setTimeout(() => {
        router.push("/");
      }, 2000);
    });
  }, [router, refetch]);

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
          <p className="text-sm text-muted-foreground">
            Payment Successful!
          </p>
        </div>
        <p className="text-muted-foreground">Redirecting you back home</p>
        <div className="flex justify-center pt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
}
