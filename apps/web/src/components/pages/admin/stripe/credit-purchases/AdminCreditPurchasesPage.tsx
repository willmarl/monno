import { CreditPurchaseSearchBar } from "@/features/stripe/components/CreditPurchaseSearchBar";
import { CreditPurchasesDataTable } from "./CreditPurchasesDataTable";
import { AdminCreditPurchasesSearchParams } from "@/types/search-params";

interface AdminCreditPurchasesPageProps {
  searchParams?: AdminCreditPurchasesSearchParams;
}

export function AdminCreditPurchasesPage({
  searchParams,
}: AdminCreditPurchasesPageProps) {
  return (
    <div>
      <CreditPurchaseSearchBar basePath="/admin/credit-purchases" />
      <CreditPurchasesDataTable searchParams={searchParams} />
    </div>
  );
}
