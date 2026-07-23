"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PackageOpen } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/button";
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

  const products = data ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Purchases</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Courses and one-time products you own.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-border px-6 py-12 text-center">
          <p className="text-sm text-destructive">
            {(error as Error).message || "Could not load purchases."}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => router.refresh()}
          >
            Try again
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-16 text-center">
          <PackageOpen
            className="mb-4 h-10 w-10 text-muted-foreground"
            aria-hidden
          />
          <h2 className="text-lg font-medium">No purchases yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            When you buy a course or product, it will show up here so you can
            open it anytime.
          </p>
          <Button asChild className="mt-6">
            <Link href="/pricing">Browse pricing</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          {products.map((product) => {
            const productName = getProductName(product.productId);
            return (
              <div
                key={product.id}
                onClick={() => {
                  if (productName) {
                    router.push(`/purchases/product/${productName}`);
                  }
                }}
                className={productName ? "cursor-pointer" : undefined}
              >
                <ProductCard data={product} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
