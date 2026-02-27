import { CreditPurchaseSearchBar } from "@/features/admin/stripe/components/CreditPurchaseSearchBar";
import { CreditPurchasesDataTable } from "./CreditPurchasesDataTable";
import { AdminCreditPurchasesSearchParams } from "@/types/search-params";

interface AdminCreditPurchasesPageProps {
  searchParams?: AdminCreditPurchasesSearchParams;
}

export function AdminCreditPurchasesPage({
  searchParams,
}: AdminCreditPurchasesPageProps) {
  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <CreditPurchaseSearchBar basePath="/admin/credit-purchases" />
      <CreditPurchasesDataTable searchParams={searchParams} />
    </div>
  );
}
