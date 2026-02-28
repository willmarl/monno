import CreditsPage from "@/components/pages/purchases/credits/CreditsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Credits",
};

export default function page() {
  return <CreditsPage />;
}
