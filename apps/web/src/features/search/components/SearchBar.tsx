"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";

export interface BaseSuggestion {
  id: string | number;
  title: string;
}

export function SearchBar<T extends BaseSuggestion = BaseSuggestion>({
  placeholder = "Search...",
  queryParam = "q",
  basePath = "/search",
  suggestionLimit = 5,
  useSuggestions,
  renderSuggestion,
  onSuggestionSelect,
  onNavigateTo,
  reactiveUrl = false,
}: {
  placeholder?: string;
  queryParam?: string;
  basePath?: string;
  suggestionLimit?: number;
  useSuggestions?: (
    q: string,
    limit: number
  ) => {
    data?: T[];
    isLoading: boolean;
  };
  renderSuggestion?: (suggestion: T) => {
    title: string;
    subtitle?: string;
  };
  onSuggestionSelect?: (suggestion: T) => string;
  onNavigateTo?: (suggestion: T) => string;
  reactiveUrl?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [value, setValue] = useState(params.get(queryParam) ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the search value to avoid too many API calls
  const debouncedValue = useDebounce(value, 300);

  // Fetch suggestions if hook is provided
  const suggestionQuery = useSuggestions
    ? useSuggestions(debouncedValue, suggestionLimit)
    : { data: [], isLoading: false };
  const suggestions = suggestionQuery.data ?? [];
  const isLoading = suggestionQuery.isLoading;

  // Update URL reactively when reactiveUrl is enabled
  useEffect(() => {
    if (!reactiveUrl) return;

    const qs = new URLSearchParams(params.toString());
    if (debouncedValue) qs.set(queryParam, debouncedValue);
    else qs.delete(queryParam);

    router.push(`${basePath}?${qs.toString()}`);
  }, [debouncedValue, reactiveUrl, router, queryParam, basePath]);

  // Handle clicks outside suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function submit(searchTerm: string = value) {
    const qs = new URLSearchParams(params.toString());
    if (searchTerm) qs.set(queryParam, searchTerm);
    else qs.delete(queryParam);

    router.push(`${basePath}?${qs.toString()}`);
    setIsOpen(false);
  }

  function handleSuggestionClick(suggestion: T) {
    // If onNavigateTo is provided, navigate directly to the item
    if (onNavigateTo) {
      const path = onNavigateTo(suggestion);
      router.push(path);
      setIsOpen(false);
      return;
    }

    // Otherwise, search by the item
    const searchTerm = onSuggestionSelect
      ? onSuggestionSelect(suggestion)
      : suggestion.title;
    submit(searchTerm);
  }

  return (
    <div className="relative w-full max-w-md z-40">
      <div className="flex items-center gap-2 w-full">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          onChange={(e) => {
            setValue(e.target.value);
            if (e.target.value && useSuggestions) {
              setIsOpen(true);
              setSelectedIndex(-1);
            }
          }}
          onKeyDown={(e) => {
            if (!isOpen || suggestions.length === 0) {
              if (e.key === "Enter") {
                submit();
              } else if (e.key === "Escape") {
                setIsOpen(false);
              }
              return;
            }

            switch (e.key) {
              case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                  prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
              case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) =>
                  prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
              case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0) {
                  handleSuggestionClick(suggestions[selectedIndex]);
                } else {
                  submit();
                }
                break;
              case "Escape":
                e.preventDefault();
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
            }
          }}
          onFocus={() => value && useSuggestions && setIsOpen(true)}
        />
        <Button onClick={() => submit()}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {useSuggestions && isOpen && value && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-md"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading suggestions...
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="py-2">
              {suggestions.map((suggestion, index) => {
                const display = renderSuggestion
                  ? renderSuggestion(suggestion)
                  : {
                      title: suggestion.title,
                      subtitle:
                        "content" in suggestion && suggestion.content
                          ? (suggestion.content as string).substring(0, 60) +
                            "..."
                          : undefined,
                    };
                const isSelected = index === selectedIndex;
                return (
                  <li key={suggestion.id}>
                    <button
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full text-left px-4 py-2 transition-colors ${
                        isSelected ? "bg-muted" : "hover:bg-muted"
                      }`}
                    >
                      <div className="font-medium text-foreground truncate">
                        {display.title}
                      </div>
                      {display.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">
                          {display.subtitle}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
