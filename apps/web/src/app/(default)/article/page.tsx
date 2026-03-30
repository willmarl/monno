import { ArticlePage } from "@/components/pages/article/ArticlePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles",
};

export default function page() {
  return (
    <div>
      <ArticlePage />
    </div>
  );
}
