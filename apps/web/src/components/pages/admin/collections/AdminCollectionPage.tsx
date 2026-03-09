import { AdminCollectionSearchBar } from "@/features/admin/collections/components/AdminCollectionSearchBar";
import { AdminCollectionSearchParams } from "@/types/search-params";
import { CollectionDataTable } from "./CollectionDataTable";

interface AdminCollectionPageProps {
  searchParams?: AdminCollectionSearchParams;
}

export function AdminCollectionPage({
  searchParams,
}: AdminCollectionPageProps) {
  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <AdminCollectionSearchBar basePath="/admin/collections" />
      <CollectionDataTable />
    </div>
  );
}
