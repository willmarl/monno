import { ProductCard } from "@/components/ui/ProductCard";

export function Products() {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      <ProductCard
        title="Course A"
        description="Lorem, ipsum dolor sit amet consectetur adipisicing elit. In, eius quisquam"
        price={30}
      />
      <ProductCard
        title="Course B"
        description="Lorem, ipsum dolor sit amet consectetur adipisicing elit. In, eius quisquam"
        price={30}
      />
    </div>
  );
}
