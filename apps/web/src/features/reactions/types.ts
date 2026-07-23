/** Quick-react strip (same as API QUICK_REACTION_EMOJIS). */
export const QUICK_REACTION_EMOJIS = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "😡",
  "🎉",
  "🔥",
] as const;

/** @deprecated Use QUICK_REACTION_EMOJIS */
export const ALLOWED_REACTION_EMOJIS = QUICK_REACTION_EMOJIS;

export type AllowedReactionEmoji = (typeof QUICK_REACTION_EMOJIS)[number];

export type ReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export type ToggleReactionInput = {
  resourceType: string;
  resourceId: number;
  emoji: string;
};

export type ToggleReactionResult = {
  reacted: boolean;
  reactions: ReactionSummary[];
};
