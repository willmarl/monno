"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SearchSortOption } from "../types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function SearchSortSection({
  sorts,
  basePath,
}: {
  sorts: SearchSortOption[];
  basePath: string;
}) {
  const params = useSearchParams();
  const router = useRouter();

  const selected = params.get("sort") ?? "";

  function update(value: string) {
    const qs = new URLSearchParams(params.toString());
    qs.set("sort", value);
    router.push(`${basePath}?${qs.toString()}`);
  }

  return (
    <div className="p-3 space-y-2">
      <p className="font-semibold text-sm">Sort By</p>

      <RadioGroup value={selected} onValueChange={update}>
        {sorts.map((sort) => (
          <div key={sort.value} className="flex items-center gap-2">
            <RadioGroupItem value={sort.value} />
            <Label>{sort.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
