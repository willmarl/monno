import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PlanCardProps {
  name: string;
  price: number;
  description?: string;
  features: string[];
  buttonText: string;
  buttonVariant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  buttonDisabled?: boolean;
  isLoading?: boolean;
  isRecommended?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

export function PlanCard({
  name,
  price,
  description,
  features,
  buttonText,
  buttonVariant = "outline",
  buttonDisabled = false,
  isLoading = false,
  isRecommended = false,
  onClick,
}: PlanCardProps) {
  return (
    <Card
      className={`flex flex-col overflow-hidden ${
        isRecommended ? "border-2 border-primary shadow-sm" : ""
      }`}
    >
      <div className={`p-8 pb-6 ${isRecommended ? "bg-muted" : ""}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-2xl font-semibold">{name}</h3>
          {isRecommended && (
            <span className="text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full">
              Recommended
            </span>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground mb-5">{description}</p>
        )}
        <div className="flex items-baseline">
          <span className="text-4xl font-bold">${price}</span>
          <span className="text-muted-foreground ml-2">/month</span>
        </div>
      </div>

      <div className="px-8 pb-8 flex-grow">
        <ul className="space-y-3 text-foreground list-disc list-inside">
          {features.map((feature, idx) => (
            <li key={idx}>{feature}</li>
          ))}
        </ul>
      </div>

      <div className="p-8 pt-0">
        <Button
          variant={buttonVariant}
          disabled={buttonDisabled || isLoading}
          onClick={onClick}
          className="w-full cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin cursor-wait" />
              Loading...
            </>
          ) : (
            buttonText
          )}
        </Button>
      </div>
    </Card>
  );
}
