"use client";

import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/ui/ProductCard";
import { useUserOwnedProducts } from "@/features/stripe/hooks";
import { STRIPE_PRODUCT_PRICES } from "@/features/stripe/constants";
import { PageLoadingState } from "@/components/common/PageLoadingState";

export function PurchasesPage() {
  const router = useRouter();
  const { data, isLoading, error } = useUserOwnedProducts();

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  const getProductName = (productId: string): string | undefined => {
    return Object.entries(STRIPE_PRODUCT_PRICES).find(
      ([_, value]) => value.productId === productId,
    )?.[0];
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {data?.map((product) => {
        const productName = getProductName(product.productId);
        return (
          <div
            key={product.id}
            onClick={() => {
              if (productName) {
                router.push(`/purchases/product/${productName}`);
              }
            }}
            className="cursor-pointer"
          >
            <ProductCard data={product} />
          </div>
        );
      })}
    </div>
  );
}
