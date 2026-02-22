"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STRIPE_PRODUCT_PRICES } from "@/features/stripe/constants";
import { ProductCard } from "@/components/pages/pricing/ProductCard";
import { toast } from "sonner";
import {
  useCreateCheckoutSession,
  useUserOwnedProducts,
} from "@/features/stripe/hooks";
import { useSessionUser } from "@/features/auth/hooks";

export function Products() {
  const router = useRouter();
  const { data: user } = useSessionUser();
  const { data: ownedProducts = [] } = useUserOwnedProducts();
  const createCheckout = useCreateCheckoutSession();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleBuyProduct = (priceId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoadingPriceId(priceId);
    createCheckout.mutate(priceId, {
      onSuccess: (res) => {
        setLoadingPriceId(null);
        if (res.url) {
          window.open(res.url);
        } else {
          toast.success("Purchase successful!");
        }
      },
      onError: (res) => {
        setLoadingPriceId(null);
        toast.error(String(res));
      },
    });
  };

  const isProductOwned = (productId: string) => {
    return ownedProducts.some(
      (purchase) =>
        purchase.productId === productId && purchase.status === "ACTIVE",
    );
  };

  const products = [
    {
      key: "COURSE_A",
      title: "Course A",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. In, eius quisquam",
      price: STRIPE_PRODUCT_PRICES.COURSE_A.amount / 100,
      priceId: STRIPE_PRODUCT_PRICES.COURSE_A.id,
      productId: STRIPE_PRODUCT_PRICES.COURSE_A.productId,
    },
    {
      key: "COURSE_B",
      title: "Course B",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. In, eius quisquam",
      price: STRIPE_PRODUCT_PRICES.COURSE_B.amount / 100,
      priceId: STRIPE_PRODUCT_PRICES.COURSE_B.id,
      productId: STRIPE_PRODUCT_PRICES.COURSE_B.productId,
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {products.map((product) => (
        <ProductCard
          key={product.key}
          title={product.title}
          description={product.description}
          price={product.price}
          onClick={() => handleBuyProduct(product.priceId)}
          isLoading={loadingPriceId === product.priceId}
          disabled={isProductOwned(product.productId)}
        />
      ))}
    </div>
  );
}
