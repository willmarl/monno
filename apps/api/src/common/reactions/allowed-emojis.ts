/**
 * Quick-react strip (Discord-style favorites shown next to SmilePlus).
 * Full picker can send any emoji; API validates with isValidReactionEmoji.
 */
export const QUICK_REACTION_EMOJIS = [
  '👍',
  '❤️',
  '😂',
  '😮',
  '😢',
  '😡',
  '🎉',
  '🔥',
] as const;

/** @deprecated Use QUICK_REACTION_EMOJIS — kept for older imports */
export const ALLOWED_REACTION_EMOJIS = QUICK_REACTION_EMOJIS;

export type QuickReactionEmoji = (typeof QUICK_REACTION_EMOJIS)[number];

/**
 * Accept any emoji grapheme / ZWJ sequence for Discord-style free reactions.
 * Rejects empty, whitespace, and oversized strings (abuse guard).
 */
export function isValidReactionEmoji(value: string): boolean {
  if (!value || value.length > 32) return false;
  if (/\s/.test(value)) return false;
  // At least one emoji pictograph (covers most modern emoji + ZWJ sequences)
  return /\p{Extended_Pictographic}/u.test(value);
}

/** @deprecated Use isValidReactionEmoji */
export function isAllowedReactionEmoji(value: string): boolean {
  return isValidReactionEmoji(value);
}
