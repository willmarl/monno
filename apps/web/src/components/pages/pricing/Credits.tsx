import { CreditCard } from "@/components/ui/CreditCard";

export function Credits() {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      <CreditCard credits={500} price={4.99} pricePerCredit="$0.01" />
      <CreditCard credits={1200} price={9.99} pricePerCredit="$0.008" />
    </div>
  );
}
