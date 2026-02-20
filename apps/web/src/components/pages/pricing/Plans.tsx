import { PlanCard } from "@/components/pages/pricing/PlanCard";

export function Plans() {
  return (
    <div className="grid md:grid-cols-3 gap-8 mb-24">
      <PlanCard
        name="Free"
        price={0}
        features={["foo", "foo", "foo"]}
        buttonText="Already active"
        buttonDisabled
      />
      <PlanCard
        name="Basic"
        price={10}
        description="For individuals"
        features={["foo", "foo", "foo"]}
        buttonText="Upgrade"
        buttonVariant="default"
      />
      <PlanCard
        name="Pro"
        price={30}
        description="For growing teams"
        features={["foo", "foo", "foo"]}
        buttonText="Upgrade"
        buttonVariant="default"
        isRecommended
      />
    </div>
  );
}
