"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, CreditCard } from "lucide-react";
import { AccInfoTab } from "./AccInfoTab";
import { SecurityTab } from "./SecurityTab";
import { PaymentTab } from "./PaymentTab";
import { useEffect, useState } from "react";

export function ProfileSettingsLayout() {
  const [hash, setHash] = useState("");
  const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";

  useEffect(() => {
    // 1. Get initial hash on load (e.g., "#account")
    setHash(window.location.hash.slice(1));

    // 2. Listen for changes if the user clicks other anchor links
    const handleHashChange = () => setHash(window.location.hash.slice(1));
    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and preferences
          </p>
        </div>

        {/* Content Area */}
        <Tabs
          value={hash || "account"}
          onValueChange={(value) => (window.location.hash = value)}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger
              value="account"
              className="flex items-center gap-2 cursor-pointer"
            >
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
            {isStripeEnabled && (
              <TabsTrigger
                value="payment"
                className="flex items-center gap-2 cursor-pointer"
              >
                <CreditCard className="h-4 w-4" />
                Payment
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <AccInfoTab />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityTab />
          </TabsContent>

          {isStripeEnabled && (
            <TabsContent value="payment" className="space-y-6">
              <PaymentTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
