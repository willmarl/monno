"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchSortOption } from "../types";

export function SearchSortCombobox({
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
    <div className="px-3 py-2">
      <p className="text-sm font-medium mb-2">Sort By</p>
      <Select value={selected} onValueChange={update}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select sort option" />
        </SelectTrigger>
        <SelectContent>
          {sorts.map((sort) => (
            <SelectItem key={sort.value} value={sort.value}>
              {sort.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
