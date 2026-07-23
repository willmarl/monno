"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useAdminStripeDashboard } from "@/features/stripe/hooks";

function formatMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export function StripeBalanceWidget() {
  const { data, isLoading, error } = useAdminStripeDashboard();

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-40 mb-4" />
        <Skeleton className="h-10 w-32" />
      </Card>
    );
  }

  if (error || !data?.configured) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-violet-100 rounded-lg dark:bg-violet-950">
            <Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Stripe balance</p>
            <p className="text-sm font-medium">Not configured</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Set STRIPE_SECRET_KEY to show live balance.
        </p>
      </Card>
    );
  }

  const available = data.balance?.available ?? [];
  const pending = data.balance?.pending ?? [];
  const primary = available[0];

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg dark:bg-violet-950">
            <Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Stripe balance</p>
            <p className="text-2xl font-bold tabular-nums">
              {primary
                ? formatMoney(primary.amount, primary.currency)
                : "$0.00"}
            </p>
          </div>
        </div>
        <Badge variant="outline">{data.mode === "live" ? "live" : "test"}</Badge>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        {available.map((b) => (
          <div key={`a-${b.currency}`} className="flex justify-between">
            <span>Available ({b.currency.toUpperCase()})</span>
            <span className="tabular-nums font-medium text-foreground">
              {formatMoney(b.amount, b.currency)}
            </span>
          </div>
        ))}
        {pending.map((b) => (
          <div key={`p-${b.currency}`} className="flex justify-between">
            <span>Pending ({b.currency.toUpperCase()})</span>
            <span className="tabular-nums">
              {formatMoney(b.amount, b.currency)}
            </span>
          </div>
        ))}
      </div>

      {data.dashboardUrl && (
        <Button asChild variant="outline" size="sm" className="mt-4">
          <a href={data.dashboardUrl} target="_blank" rel="noreferrer">
            Open in Stripe
          </a>
        </Button>
      )}
    </Card>
  );
}
