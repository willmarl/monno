import { fetcher } from "@/lib/fetcher";
import type { ToggleReactionInput, ToggleReactionResult } from "./types";

export const toggleReaction = (data: ToggleReactionInput) =>
  fetcher<ToggleReactionResult>("/reactions/toggle", {
    method: "POST",
    json: data,
  });
