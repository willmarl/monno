import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  title: string;
  description: string;
  price: number;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ProductCard({
  title,
  description,
  price,
  onClick,
  isLoading,
  disabled,
}: ProductCardProps) {
  return (
    <Card className="p-6 flex flex-col hover:border-border transition-colors">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 min-h-[3rem] flex-grow">
        {description}
      </p>
      <div className="flex items-baseline mb-5">
        <span className="text-2xl font-bold">${price}</span>
        <span className="text-muted-foreground ml-2 text-sm">one-time</span>
      </div>
      <Button
        variant="outline"
        className="w-full cursor-pointer"
        onClick={onClick}
        disabled={isLoading || disabled}
      >
        {isLoading ? "Processing..." : disabled ? "Already owned" : "Purchase"}
      </Button>
    </Card>
  );
}
