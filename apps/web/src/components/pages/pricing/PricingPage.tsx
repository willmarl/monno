import { Separator } from "@/components/ui/separator";
import { Plans } from "./Plans";
import { Products } from "./Products";
import { Credits } from "./Credits";

export function PricingPage() {
  return (
    <main className="max-w-6xl mx-auto px-5 py-16 md:py-24">
      {/* Subscription Tiers Heading */}
      <div className="text-center mb-16" id="subscriptions">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Upgrade your plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the tier that fits your needs — or grab individual products
          with lifetime access.
        </p>
      </div>

      {/* Subscription Tiers */}
      <Plans />

      {/* Divider */}
      <Separator className="my-24" />

      {/* One-time Products Heading */}
      <div className="text-center mb-12" id="products">
        <h2 className="text-3xl font-semibold mb-3">One-time Products</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Lifetime access — no subscription needed.
        </p>
      </div>

      {/* One-time Products */}
      <Products />

      {/* Divider */}
      <Separator className="my-24" />

      {/* Credits Heading */}
      <div className="text-center mb-12" id="credits">
        <h2 className="text-3xl font-semibold mb-3">Credits & Tokens</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get credits for one-time purchases — use them anytime.
        </p>
      </div>

      {/* Credits */}
      <Credits />
    </main>
  );
}
