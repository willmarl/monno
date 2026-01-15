"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchFilterOption } from "../types";

export function SearchFilterToggle({
  filter,
  basePath,
}: {
  filter: SearchFilterOption;
  basePath: string;
}) {
  const params = useSearchParams();
  const router = useRouter();

  const isActive = params.get(filter.name) === "true";

  function toggle() {
    const qs = new URLSearchParams(params.toString());
    if (isActive) {
      qs.delete(filter.name);
    } else {
      qs.set(filter.name, "true");
    }
    router.push(`${basePath}?${qs.toString()}`);
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between">
        <Label>{filter.label}</Label>
        <Switch checked={isActive} onCheckedChange={toggle} />
      </div>
    </div>
  );
}
