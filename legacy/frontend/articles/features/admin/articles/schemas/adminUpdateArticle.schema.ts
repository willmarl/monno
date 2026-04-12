import { z } from "zod";
import { ARTICLE_STATUSES } from "../types/article";

export const adminUpdateArticleSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(1000).optional(),
  status: z.enum(ARTICLE_STATUSES).optional(),
});

export type AdminUpdateArticleInput = z.infer<typeof adminUpdateArticleSchema>;
