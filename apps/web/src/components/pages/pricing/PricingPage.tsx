import { Separator } from "@/components/ui/separator";
import { Plans } from "./Plans";
import { Courses } from "./Courses";

export function PricingPage() {
  return (
    <main className="max-w-6xl mx-auto px-5 py-16 md:py-24">
      {/* Subscription Tiers Heading */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Upgrade your plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the tier that fits your needs — or grab individual courses with
          lifetime access.
        </p>
      </div>

      {/* Subscription Tiers */}
      <Plans />

      {/* Divider */}
      <Separator className="my-24" />

      {/* One-time Courses Heading */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold mb-3">One-time Courses</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Lifetime access — no subscription needed.
        </p>
      </div>

      {/* One-time Courses */}
      <Courses />
    </main>
  );
}
