import { SubscriptionSearchBar } from "@/features/admin/stripe/components/SubscriptionsSearchBar";
import { SubscriptionDataTable } from "./SubscriptionsDataTable";
import { AdminSubscriptionsSearchParams } from "@/types/search-params";

interface AdminSubscriptionsPageProps {
  searchParams?: AdminSubscriptionsSearchParams;
}

export function AdminSubscriptionsPage({
  searchParams,
}: AdminSubscriptionsPageProps) {
  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <SubscriptionSearchBar basePath="/admin/subscriptions" />
      <SubscriptionDataTable searchParams={searchParams} />
    </div>
  );
}
