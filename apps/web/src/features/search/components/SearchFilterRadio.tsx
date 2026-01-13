"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchFilterOption } from "./types";

export function SearchFilterRadio({
  filter,
  basePath,
}: {
  filter: SearchFilterOption;
  basePath: string;
}) {
  const params = useSearchParams();
  const router = useRouter();

  const selected = params.get(filter.name) ?? "";

  function update(value: string) {
    const qs = new URLSearchParams(params.toString());
    qs.set(filter.name, value);
    router.push(`${basePath}?${qs.toString()}`);
  }

  return (
    <div className="p-3 space-y-2">
      <p className="font-semibold text-sm">{filter.label}</p>

      <RadioGroup value={selected} onValueChange={update}>
        {filter.options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem value={opt.value} />
            <Label>{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
