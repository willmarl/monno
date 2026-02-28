import { PricingPage } from "@/components/pages/pricing/PricingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "foo",
};

export default function page() {
  return <PricingPage />;
}
