"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebounce } from "@/hooks/useDebounce";
import { useAdminUserSuggestions } from "@/features/users/hooks";
import type { AdminUserSuggestion } from "@/features/users/api";
import type { UserStatus } from "@/features/users/types/user";

export type UserSuggestSelection = Pick<
  AdminUserSuggestion,
  "id" | "username" | "avatarPath" | "status" | "deleted"
>;

interface UserSuggestPickerProps {
  value: UserSuggestSelection[];
  onChange: (users: UserSuggestSelection[]) => void;
  placeholder?: string;
  suggestionLimit?: number;
  maxRecipients?: number;
  error?: string;
}

function statusLabel(status: UserStatus, deleted: boolean) {
  if (deleted) return "soft-deleted";
  return status.toLowerCase();
}

export function UserSuggestPicker({
  value,
  onChange,
  placeholder = "Search by username…",
  suggestionLimit = 5,
  maxRecipients = 100,
  error,
}: UserSuggestPickerProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(value.map((u) => u.id));
  const atCap = value.length >= maxRecipients;

  const debouncedQuery = useDebounce(query, 300);
  const { data: rawSuggestions = [], isLoading } = useAdminUserSuggestions(
    atCap ? "" : debouncedQuery,
    suggestionLimit + selectedIds.size,
  );

  const suggestions = rawSuggestions
    .filter((u) => !selectedIds.has(u.id))
    .slice(0, suggestionLimit);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        listRef.current &&
        !listRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addUser(user: AdminUserSuggestion) {
    if (selectedIds.has(user.id) || atCap) return;
    onChange([
      ...value,
      {
        id: user.id,
        username: user.username,
        avatarPath: user.avatarPath,
        status: user.status,
        deleted: user.deleted,
      },
    ]);
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function removeUser(id: number) {
    onChange(value.filter((u) => u.id !== id));
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {value.map((user) => (
            <li
              key={user.id}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2"
            >
              <Avatar className="h-8 w-8 shrink-0">
                {user.avatarPath && (
                  <AvatarImage src={user.avatarPath} alt={user.username} />
                )}
                <AvatarFallback className="text-xs font-semibold">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.username}</p>
                <p className="text-xs text-muted-foreground">
                  ID {user.id} · {statusLabel(user.status, user.deleted)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeUser(user.id)}
                aria-label={`Remove ${user.username}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          placeholder={
            atCap ? `Maximum ${maxRecipients} recipients` : placeholder
          }
          disabled={atCap}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(!!e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={(e) => {
            if (!isOpen || suggestions.length === 0) {
              if (e.key === "Escape") setIsOpen(false);
              return;
            }

            switch (e.key) {
              case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                  prev < suggestions.length - 1 ? prev + 1 : 0,
                );
                break;
              case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) =>
                  prev > 0 ? prev - 1 : suggestions.length - 1,
                );
                break;
              case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0) {
                  addUser(suggestions[selectedIndex]);
                }
                break;
              case "Escape":
                e.preventDefault();
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
            }
          }}
        />

        {isOpen && query && !atCap && (
          <div
            ref={listRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-border bg-popover shadow-md"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : suggestions.length > 0 ? (
              <ul className="py-1">
                {suggestions.map((user, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => addUser(user)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                          isSelected ? "bg-muted" : "hover:bg-muted"
                        }`}
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          {user.avatarPath && (
                            <AvatarImage
                              src={user.avatarPath}
                              alt={user.username}
                            />
                          )}
                          <AvatarFallback className="text-xs font-semibold">
                            {user.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {user.username}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            ID {user.id} ·{" "}
                            {statusLabel(user.status, user.deleted)}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-3 text-center text-sm text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        )}
      </div>

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length} recipient{value.length === 1 ? "" : "s"} — each gets a
          separate email (not CC).
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
