"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag } from "lucide-react";
import { useAdminStripeDashboard } from "@/features/stripe/hooks";
import { format } from "date-fns";

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

function kindHref(kind: string) {
  switch (kind) {
    case "product":
      return "/admin/products-purchased";
    case "credits":
      return "/admin/credit-purchases";
    case "subscription":
      return "/admin/subscriptions";
    default:
      return "/admin";
  }
}

function kindLabel(kind: string) {
  switch (kind) {
    case "product":
      return "Product";
    case "credits":
      return "Credits";
    case "subscription":
      return "Sub";
    default:
      return kind;
  }
}

export function RecentPurchasesWidget() {
  const { data, isLoading, error } = useAdminStripeDashboard();

  if (isLoading) {
    return (
      <Card className="p-6 md:col-span-2">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (error || !data?.configured) {
    return (
      <Card className="p-6 md:col-span-2">
        <h3 className="text-lg font-semibold mb-2">Recent purchases</h3>
        <p className="text-sm text-muted-foreground">
          Stripe is not configured, so purchase activity is hidden here.
        </p>
      </Card>
    );
  }

  const items = data.recent ?? [];

  return (
    <Card className="p-6 md:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Recent purchases</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          Last {items.length} from app DB
        </span>
      </div>

      <div className="space-y-1">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={`${item.kind}-${item.id}`}>
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge variant="outline" className="whitespace-nowrap">
                    {kindLabel(item.kind)}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.label}
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        · {item.username}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.status}
                      {item.amountCents != null && item.currency
                        ? ` · ${formatMoney(item.amountCents, item.currency)}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(item.at), "MMM d, h:mm a")}
                  </span>
                  <Link
                    href={kindHref(item.kind)}
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
              {index < items.length - 1 && <Separator />}
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No purchases yet</p>
          </div>
        )}
      </div>
    </Card>
  );
}
