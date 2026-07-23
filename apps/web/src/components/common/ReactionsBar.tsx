"use client";

import { useState } from "react";
import { Smile, SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker";
import { useSessionUser } from "@/features/auth/hooks";
import { useModal } from "@/components/providers/ModalProvider";
import { AuthModal } from "@/features/auth/components/modal/AuthModal";
import { useToggleReaction } from "@/features/reactions/hooks";
import {
  QUICK_REACTION_EMOJIS,
  type ReactionSummary,
} from "@/features/reactions/types";
import type { ResourceType } from "@/types/resource";
import { cn } from "@/lib/utils";

interface ReactionsBarProps {
  resourceType: ResourceType;
  resourceId: number;
  reactions?: ReactionSummary[];
}

/**
 * Discord-style emoji reactions. Coexists with LikeButton — does not replace it.
 * SmilePlus = quick favorites; Smile = full frimousse picker (native system emojis).
 */
export function ReactionsBar({
  resourceType,
  resourceId,
  reactions = [],
}: ReactionsBarProps) {
  const { data: user } = useSessionUser();
  const { openModal } = useModal();
  const toggle = useToggleReaction();
  const [quickOpen, setQuickOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);

  const requireAuth = () => {
    if (!user) {
      openModal({
        title: "",
        content: <AuthModal title="Login to react" />,
      });
      return false;
    }
    return true;
  };

  const onToggle = (emoji: string) => {
    if (!requireAuth()) return;
    toggle.mutate({ resourceType, resourceId, emoji });
    setQuickOpen(false);
    setFullOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          disabled={toggle.isPending}
          onClick={() => onToggle(r.emoji)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs cursor-pointer transition-colors",
            r.reactedByMe
              ? "border-primary/40 bg-primary/10"
              : "border-border bg-muted/40 hover:bg-muted",
          )}
          title={r.reactedByMe ? "Remove reaction" : "Add reaction"}
        >
          <span>{r.emoji}</span>
          <span className="text-muted-foreground tabular-nums">{r.count}</span>
        </button>
      ))}

      {/* Quick favorites */}
      <Popover open={quickOpen} onOpenChange={setQuickOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer"
            aria-label="Quick reactions"
            title="Quick reactions"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                requireAuth();
              }
            }}
          >
            <SmilePlus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {QUICK_REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="h-8 w-8 rounded-md text-base hover:bg-muted cursor-pointer"
                onClick={() => onToggle(emoji)}
                disabled={toggle.isPending}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Full emoji picker — native system glyphs, Monno/shadcn chrome */}
      <Popover open={fullOpen} onOpenChange={setFullOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer"
            aria-label="All emojis"
            title="All emojis"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                requireAuth();
              }
            }}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit p-0" align="start">
          <EmojiPicker
            className="h-[342px]"
            onEmojiSelect={({ emoji }) => {
              onToggle(emoji);
            }}
          >
            <EmojiPickerSearch />
            <EmojiPickerContent />
            <EmojiPickerFooter />
          </EmojiPicker>
        </PopoverContent>
      </Popover>
    </div>
  );
}
