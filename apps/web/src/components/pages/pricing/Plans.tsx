"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlanCard } from "@/components/pages/pricing/PlanCard";
import { useSessionUser } from "@/features/auth/hooks";
import {
  getTierLevel,
  isUpgrade,
  isDowngrade,
  TIER_HIERARCHY,
  STRIPE_SUBSCRIPTION_PRICES,
} from "@/features/stripe/constants";
import { toast } from "sonner";
import {
  useCreateCheckoutSession,
  useCustomerPortal,
} from "@/features/stripe/hooks";

export function Plans() {
  const router = useRouter();
  const { data: user, refetch } = useSessionUser();
  const currentTier = user?.subscription?.tier || "FREE";
  const nextTier = user?.subscription?.nextTier || null;
  const createCheckout = useCreateCheckoutSession();
  const portalMutation = useCustomerPortal();
  const [loadingTier, setLoadingTier] = useState<
    "FREE" | "BASIC" | "PRO" | null
  >(null);

  // Handle plan selection - redirect to login if guest
  const handlePlanClick = (targetTier: "FREE" | "BASIC" | "PRO") => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (targetTier === "FREE") {
      setLoadingTier("FREE");
      portalMutation.mutate(undefined, {
        onSuccess: (data) => {
          setLoadingTier(null);
          if (data?.url) {
            window.open(data.url, "_blank");
            // Refetch after portal closes (user manages subscription there)
            setTimeout(() => refetch(), 1000);
          }
        },
        onError: (res) => {
          setLoadingTier(null);
          toast.error(String(res));
        },
      });
    }
    if (targetTier === "BASIC") {
      setLoadingTier("BASIC");
      createCheckout.mutate(STRIPE_SUBSCRIPTION_PRICES.BASIC.id, {
        onSuccess: (res) => {
          setLoadingTier(null);
          if (res.url) {
            window.open(res.url);
          } else {
            toast.success(String(res));
            refetch();
          }
        },
        onError: (res) => {
          setLoadingTier(null);
          toast.error(String(res));
        },
      });
    }
    if (targetTier === "PRO") {
      setLoadingTier("PRO");
      createCheckout.mutate(STRIPE_SUBSCRIPTION_PRICES.PRO.id, {
        onSuccess: (res) => {
          setLoadingTier(null);
          if (res.url) {
            window.open(res.url);
          } else {
            toast.success(String(res));
            refetch();
          }
        },
        onError: (res) => {
          setLoadingTier(null);
          toast.error(String(res));
        },
      });
    }
  };

  // Determine button text for each tier
  const getButtonText = (targetTier: "FREE" | "BASIC" | "PRO"): string => {
    if (currentTier === targetTier) {
      return "Already active";
    }
    // Check if cancellation is scheduled (nextTier is FREE and not current)
    if (
      nextTier === "FREE" &&
      targetTier === "FREE" &&
      currentTier !== "FREE"
    ) {
      return "Stop cancellation";
    }
    // Check if downgrade is scheduled for this tier
    if (nextTier === targetTier && targetTier !== "FREE") {
      return "Scheduled for next billing";
    }
    if (isUpgrade(currentTier, targetTier)) {
      return "Upgrade";
    }
    return "Downgrade";
  };

  // Determine button variant for each tier
  const getButtonVariant = (
    targetTier: "FREE" | "BASIC" | "PRO",
  ): "default" | "secondary" | "destructive" => {
    if (currentTier === targetTier) {
      return "secondary";
    }
    // Check if cancellation is scheduled - make it a primary action
    if (
      nextTier === "FREE" &&
      targetTier === "FREE" &&
      currentTier !== "FREE"
    ) {
      return "default";
    }
    // Check if downgrade is scheduled for this tier
    if (nextTier === targetTier && targetTier !== "FREE") {
      return "secondary";
    }
    if (isUpgrade(currentTier, targetTier)) {
      return "default";
    }
    return "destructive";
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 mb-24">
      <PlanCard
        name="Free"
        price={0}
        features={["foo", "foo", "foo"]}
        buttonText={getButtonText("FREE")}
        buttonVariant={getButtonVariant("FREE")}
        buttonDisabled={currentTier === "FREE" || loadingTier !== null}
        isLoading={loadingTier === "FREE"}
        onClick={() => handlePlanClick("FREE")}
      />
      <PlanCard
        name="Basic"
        price={10}
        description="For individuals"
        features={["foo", "foo", "foo"]}
        buttonText={getButtonText("BASIC")}
        buttonVariant={getButtonVariant("BASIC")}
        buttonDisabled={
          currentTier === "BASIC" ||
          nextTier === "BASIC" ||
          loadingTier !== null
        }
        isLoading={loadingTier === "BASIC"}
        onClick={() => handlePlanClick("BASIC")}
      />
      <PlanCard
        name="Pro"
        price={30}
        description="For growing teams"
        features={["foo", "foo", "foo"]}
        buttonText={getButtonText("PRO")}
        buttonVariant={getButtonVariant("PRO")}
        buttonDisabled={
          currentTier === "PRO" || nextTier === "PRO" || loadingTier !== null
        }
        isLoading={loadingTier === "PRO"}
        onClick={() => handlePlanClick("PRO")}
        isRecommended
      />
    </div>
  );
}
