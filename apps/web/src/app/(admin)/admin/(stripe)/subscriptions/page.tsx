import { AdminSubscriptionsPage } from "@/components/pages/admin/stripe/subscription/AdminSubscriptionsPage";
import { AdminSubscriptionsSearchParams } from "@/types/search-params";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<AdminSubscriptionsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <div>
      <AdminSubscriptionsPage searchParams={params} />
    </div>
  );
}
