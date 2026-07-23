"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import {
  useAdminSendInvoice,
  useAdminSubscriptionInvoices,
  useAdminVoidInvoice,
} from "@/features/stripe/hooks";

export function SubscriptionInvoicesPanel({
  subscriptionId,
}: {
  subscriptionId: number;
}) {
  const { data, isLoading, error, refetch } = useAdminSubscriptionInvoices(
    subscriptionId,
  );
  const sendInvoice = useAdminSendInvoice();
  const voidInvoice = useAdminVoidInvoice();

  if (isLoading) {
    return <PageLoadingState />;
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {(error as Error).message || "Failed to load invoices"}
      </p>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No invoices found.</p>
    );
  }

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
      <p className="text-sm text-muted-foreground">
        Invoices for {data?.username}
      </p>
      <ul className="space-y-2">
        {items.map((inv) => {
          const amount = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: (inv.currency || "usd").toUpperCase(),
          }).format((inv.amountDue || inv.amountPaid || 0) / 100);

          return (
            <li
              key={inv.id}
              className="rounded-md border border-border p-3 space-y-2"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {inv.number || inv.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inv.status} · {amount} ·{" "}
                    {new Date(inv.created * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {inv.hostedInvoiceUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(inv.hostedInvoiceUrl!, "_blank")
                      }
                    >
                      View
                    </Button>
                  )}
                  {inv.invoicePdf && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(inv.invoicePdf!, "_blank")}
                    >
                      PDF
                    </Button>
                  )}
                  {inv.status === "draft" && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={sendInvoice.isPending}
                      onClick={async () => {
                        try {
                          await sendInvoice.mutateAsync(inv.id);
                          toast.success("Invoice sent");
                          refetch();
                        } catch (e: any) {
                          toast.error(e?.message || "Send failed");
                        }
                      }}
                    >
                      Send
                    </Button>
                  )}
                  {inv.status === "open" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={voidInvoice.isPending}
                      onClick={async () => {
                        try {
                          await voidInvoice.mutateAsync(inv.id);
                          toast.success("Invoice voided");
                          refetch();
                        } catch (e: any) {
                          toast.error(e?.message || "Void failed");
                        }
                      }}
                    >
                      Void
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
