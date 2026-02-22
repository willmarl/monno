"use client";

import { useEffect } from "react";
import { STRIPE_PRODUCT_PRICES } from "@/features/stripe/constants";
import { useSessionUser } from "@/features/auth/hooks";
import { useParams } from "next/navigation";
import { useUserOwnedProducts } from "@/features/stripe/hooks";
import { useRouter } from "next/navigation";

export function ProductSlugPage() {
  const { data: products } = useUserOwnedProducts();
  const { data: user } = useSessionUser();
  const params = useParams();
  const slug = params.name as string;
  const router = useRouter();

  // Check if user owns the product
  const productOwned = () => {
    if (!slug || !products) return false;

    const productData =
      STRIPE_PRODUCT_PRICES[slug as keyof typeof STRIPE_PRODUCT_PRICES];
    if (!productData) return false;

    return products.some(
      (purchase) =>
        purchase.productId === productData.productId &&
        purchase.status === "ACTIVE",
    );
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (products && !productOwned()) {
      router.push("/purchases");
      return;
    }
  }, [user, products, slug, router]);

  if (!productOwned()) {
    return <div>Loading...</div>;
  }

  let content = "";
  if (slug === "COURSE_A") {
    content = "Course A content here";
  }
  if (slug === "COURSE_B") {
    content = "Course B content here";
  }

  return <div>{content}</div>;
}
