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
    <div>
      <SubscriptionSearchBar basePath="/admin/subscriptions" />
      <SubscriptionDataTable searchParams={searchParams} />
    </div>
  );
}
