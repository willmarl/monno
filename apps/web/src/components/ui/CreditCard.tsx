import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CreditCardProps {
  credits: number;
  price: number;
  pricePerCredit?: string;
  onClick?: () => void;
  isLoading?: boolean;
}

export function CreditCard({
  credits,
  price,
  pricePerCredit,
  onClick,
  isLoading = false,
}: CreditCardProps) {
  return (
    <Card className="p-6 flex flex-col hover:border-border transition-colors">
      <h3 className="text-xl font-semibold mb-2">
        {credits.toLocaleString()} Credits
      </h3>
      <p className="text-muted-foreground mb-4 min-h-[3rem] flex-grow">
        {pricePerCredit && <span>{pricePerCredit} per credit</span>}
      </p>
      <div className="flex items-baseline mb-5">
        <span className="text-2xl font-bold">${price}</span>
        <span className="text-muted-foreground ml-2 text-sm">one-time</span>
      </div>
      <Button
        variant="outline"
        className="w-full cursor-pointer"
        disabled={isLoading}
        onClick={onClick}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          "Buy Credits"
        )}
      </Button>
    </Card>
  );
}
