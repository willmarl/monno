// Do not use until stripe 2 revamp

// "use client";

// import { Suspense } from "react";
// import { useSearchParams } from "next/navigation";
// import { useUserOwnedProducts } from "@/features/stripe/hooks";
// import { ProductCard } from "@/components/ui/ProductCard";
// import { PaginatedList } from "@/components/ui/pagination/PaginatedList";
// import { useSessionUser } from "@/features/auth/hooks";

// const DEFAULT_LIMIT = 1;

// function ProductCardsListContent() {
//   const { data: user } = useSessionUser();

//   const searchParams = useSearchParams();

//   // Get page from query params
//   const page = parseInt(searchParams.get("page") ?? "1", 10);

//   const { data, isLoading } = useUserOwnedProducts(page, DEFAULT_LIMIT);

//   const productcards = data?.items ?? [];
//   const totalItems = data?.pageInfo?.totalItems ?? 0;

//   return (
//     <PaginatedList
//       url="./purchases"
//       page={page}
//       limit={DEFAULT_LIMIT}
//       items={productcards}
//       totalItems={totalItems}
//       isLoading={isLoading}
//       renderItem={(productcard) => <ProductCard data={productcard} />}
//       title="Owned products"
//       layout="grid"
//     />
//   );
// }

// export function PaginatedProductContent() {
//   return (
//     <Suspense fallback={<p>Loading...</p>}>
//       <ProductCardsListContent />
//     </Suspense>
//   );
// }
