import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ProductPurchase } from "@/features/stripe/types/stripe";

export function ProductCard({ data }: { data: ProductPurchase }) {
  const { productId, status, purchasedAt, refundedAt } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "REFUNDED":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Image Section */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-blue-400 to-purple-300 overflow-hidden flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-sm font-medium opacity-70">Product Image</p>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        {/* Title and Product ID */}
        <div className="mb-3">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
            Product {productId}
          </h3>
          <p className="text-xs text-muted-foreground">ID: {productId}</p>
        </div>

        {/* Status Badge */}
        <div className="mb-3">
          <Badge variant={getStatusColor(status) as any}>{status}</Badge>
        </div>

        {/* Dates */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Purchased:</span>{" "}
            {format(new Date(purchasedAt), "MMM d, yyyy")}
          </div>
          {refundedAt && (
            <div>
              <span className="font-medium">Refunded:</span>{" "}
              {format(new Date(refundedAt), "MMM d, yyyy")}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
