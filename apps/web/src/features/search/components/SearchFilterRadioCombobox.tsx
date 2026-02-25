"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchFilterOption } from "../types";

export function SearchFilterRadioCombobox({
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
    if (value === "__none__") {
      // Clear this specific filter without clearing others
      qs.delete(filter.name);
    } else {
      qs.set(filter.name, value);
    }
    router.push(`${basePath}?${qs.toString()}`);
  }

  return (
    <div className="px-3 py-2">
      <p className="text-sm font-medium mb-2">{filter.label}</p>
      <Select value={selected || "__none__"} onValueChange={update}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">All</SelectItem>
          {filter.options?.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
