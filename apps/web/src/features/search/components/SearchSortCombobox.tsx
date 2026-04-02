"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { SearchSortOption } from "../types";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchSortCombobox({
  sorts,
  basePath,
}: {
  sorts: SearchSortOption[];
  basePath: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const selected = params.get("sort") ?? "";
  const selectedLabel =
    sorts.find((sort) => sort.value === selected)?.label ||
    "Select sort option";

  function update(value: string) {
    const qs = new URLSearchParams(params.toString());
    qs.set("sort", value);
    router.push(`${basePath}?${qs.toString()}`);
    setOpen(false);
  }

  return (
    <div className="px-3 py-2">
      <p className="text-sm font-medium mb-2">Sort By</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
          <Command className="w-full">
            <CommandEmpty>No sort option found.</CommandEmpty>
            <CommandGroup>
              {sorts.map((sort) => (
                <CommandItem
                  key={sort.value}
                  value={sort.value}
                  onSelect={() => update(sort.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected === sort.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {sort.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
