import { z } from "zod";
import { ARTICLE_STATUSES } from "../types/article";

export const adminCreateArticleSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(1000),
  status: z.enum(ARTICLE_STATUSES),
});

export type AdminCreateArticleInput = z.infer<typeof adminCreateArticleSchema>;
