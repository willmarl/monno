"use client";
import { SubscriptionSection } from "./SubscriptionSection";
import { CreditsSection } from "./CreditsSection";

export function PaymentTab() {
  return (
    <div className="space-y-6">
      <SubscriptionSection />
      <CreditsSection />
    </div>
  );
}
