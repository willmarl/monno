"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { SearchFilterOption } from "../types";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchFilterRadioCombobox({
  filter,
  basePath,
}: {
  filter: SearchFilterOption;
  basePath: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const selected = params.get(filter.name) ?? "";
  const selectedLabel =
    filter.options?.find((opt) => opt.value === selected)?.label ||
    "Select an option";

  function update(value: string) {
    const qs = new URLSearchParams(params.toString());
    if (value === "__none__") {
      // Clear this specific filter without clearing others
      qs.delete(filter.name);
    } else {
      qs.set(filter.name, value);
    }
    router.push(`${basePath}?${qs.toString()}`);
    setOpen(false);
  }

  return (
    <div className="px-3 py-2">
      <p className="text-sm font-medium mb-2">{filter.label}</p>
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
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {filter.options?.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={() => update(opt.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected === opt.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
