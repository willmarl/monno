"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ProfileListSearchProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Debounced inline search for profile list sections (local state, not URL).
 */
export function ProfileListSearch({
  placeholder = "Search…",
  value,
  onChange,
}: ProfileListSearchProps) {
  const [draft, setDraft] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      onChangeRef.current(draft);
    }, 300);
    return () => clearTimeout(t);
  }, [draft]);

  return (
    <div className="relative mb-3 max-w-sm">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
        aria-label={placeholder}
      />
    </div>
  );
}
