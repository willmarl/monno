import { fetcher } from "@/lib/fetcher";
import type { Like, LikeInput } from "./types/like";

// POST /likes/toggle
export const toggleLike = (data: LikeInput) =>
  fetcher<Like>("/likes/toggle", {
    method: "POST",
    json: data,
  });
