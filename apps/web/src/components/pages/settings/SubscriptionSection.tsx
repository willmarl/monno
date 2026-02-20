"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useUserSubscription,
  useCustomerPortal,
} from "@/features/stripe/hooks";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { differenceInDays, format } from "date-fns";

export function SubscriptionSection() {
  const { data: subscription, isLoading, error } = useUserSubscription();
  const portalMutation = useCustomerPortal();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "CANCELED":
        return "destructive";
      case "PAST_DUE":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "PRO":
        return "default";
      case "BASIC":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          Manage your subscription plan and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm">Failed to load subscription info</p>
          </div>
        ) : subscription ? (
          <>
            {/* Current Tier and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Current Plan
                </p>
                <Badge
                  variant={getTierBadgeColor(subscription.tier)}
                  className="text-base px-3 py-1"
                >
                  {subscription.tier}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <Badge variant={getStatusColor(subscription.status)}>
                  {subscription.status}
                </Badge>
              </div>
            </div>

            {/* Pending Downgrade or Next Billing */}
            <div className="border-t pt-4">
              {subscription.nextTier &&
              subscription.nextTier !== subscription.tier ? (
                <div className="space-y-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-100 text-sm">
                        Downgrade scheduled
                      </p>
                      <p className="text-amber-800 dark:text-amber-200 text-sm mt-1">
                        Your plan will downgrade to{" "}
                        <strong>{subscription.nextTier}</strong> on{" "}
                        <strong>
                          {format(
                            new Date(subscription.periodEnd),
                            "MMM d, yyyy",
                          )}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        {subscription.status === "ACTIVE" ? (
                          <>
                            Next billing in{" "}
                            <strong>
                              {Math.max(
                                0,
                                differenceInDays(
                                  new Date(subscription.periodEnd),
                                  new Date(),
                                ),
                              )}{" "}
                              day
                              {differenceInDays(
                                new Date(subscription.periodEnd),
                                new Date(),
                              ) !== 1
                                ? "s"
                                : ""}
                            </strong>
                          </>
                        ) : (
                          "Subscription inactive"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Portal Button */}
            <Button
              onClick={() =>
                portalMutation.mutate(undefined, {
                  onSuccess: (data) => {
                    if (data?.url) {
                      window.open(data.url, "_blank");
                    }
                  },
                })
              }
              disabled={portalMutation.isPending}
              size="lg"
              className="w-full cursor-pointer"
            >
              {portalMutation.isPending ? "Loading..." : "Manage Subscription"}
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No active subscription</p>
            <Button variant="outline" className="mt-4">
              View Plans
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
