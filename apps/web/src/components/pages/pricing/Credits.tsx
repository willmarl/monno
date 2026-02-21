"use client";

import { useState } from "react";
import { STRIPE_CREDIT_PRICES } from "@/features/stripe/constants";
import { CreditCard } from "@/components/ui/CreditCard";
import { toast } from "sonner";
import { useCreateCheckoutSession } from "@/features/stripe/hooks";
import { useSessionUser } from "@/features/auth/hooks";
import { useRouter } from "next/navigation";

export function Credits() {
  const router = useRouter();
  const { data: user } = useSessionUser();
  const createCheckout = useCreateCheckoutSession();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleBuyCredits = (priceId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoadingPriceId(priceId);
    createCheckout.mutate(priceId, {
      onSuccess: (res) => {
        setLoadingPriceId(null);
        if (res.url) {
          window.open(res.url);
        } else {
          toast.success("Payment successful!");
        }
      },
      onError: (res) => {
        setLoadingPriceId(null);
        toast.error(String(res));
      },
    });
  };

  const creditPackages = [
    {
      key: "CREDITS_4_99",
      credits: STRIPE_CREDIT_PRICES.CREDITS_4_99.credits,
      amount: STRIPE_CREDIT_PRICES.CREDITS_4_99.amount,
      priceId: STRIPE_CREDIT_PRICES.CREDITS_4_99.id,
    },
    {
      key: "CREDITS_9_99",
      credits: STRIPE_CREDIT_PRICES.CREDITS_9_99.credits,
      amount: STRIPE_CREDIT_PRICES.CREDITS_9_99.amount,
      priceId: STRIPE_CREDIT_PRICES.CREDITS_9_99.id,
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {creditPackages.map((pkg) => {
        const price = (pkg.amount / 100).toFixed(2);
        const pricePerCredit = (pkg.amount / 100 / pkg.credits).toFixed(3);
        return (
          <CreditCard
            key={pkg.key}
            credits={pkg.credits}
            price={parseFloat(price)}
            pricePerCredit={`$${pricePerCredit} per credit`}
            onClick={() => handleBuyCredits(pkg.priceId)}
            isLoading={loadingPriceId === pkg.priceId}
          />
        );
      })}
    </div>
  );
}
