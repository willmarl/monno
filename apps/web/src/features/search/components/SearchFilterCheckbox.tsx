"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchFilterOption } from "./types";

export function SearchFilterCheckbox({
  filter,
  basePath,
}: {
  filter: SearchFilterOption;
  basePath: string;
}) {
  const params = useSearchParams();
  const router = useRouter();

  const selected = params.get(filter.name)?.split(",") ?? [];

  function toggle(value: string) {
    const next = new Set(selected);
    next.has(value) ? next.delete(value) : next.add(value);

    const qs = new URLSearchParams(params.toString());

    if (next.size > 0) qs.set(filter.name, Array.from(next).join(","));
    else qs.delete(filter.name);

    router.push(`${basePath}?${qs.toString()}`);
  }

  return (
    <div className="p-3 space-y-2">
      <p className="font-semibold text-sm">{filter.label}</p>

      {filter.options.map((opt) => (
        <div key={opt.value} className="flex items-center gap-2">
          <Checkbox
            checked={selected.includes(opt.value)}
            onCheckedChange={() => toggle(opt.value)}
          />
          <Label>{opt.label}</Label>
        </div>
      ))}
    </div>
  );
}
