"use client";

import { PaginatedArticles } from "./PaginatedArticles";
import { CursorArticles } from "./CursorArticles";
import { CursorInfiniteArticles } from "./CursorInfiniteArticles";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/ModalProvider";
import { CreateArticleModal } from "@/features/articles/components/modal/CreateArticleModal";

export function ArticlePage() {
  const router = useRouter();

  const { openModal } = useModal();

  return (
    <div>
      <div>
        <Button
          className="cursor-pointer w-full md:w-auto"
          onClick={() => router.push("/article/create")}
        >
          <Plus /> Article
        </Button>
        {/* test inline forms work. remove this button after test */}
        <Button
          onClick={() => {
            openModal({
              title: "Create new article",
              content: <CreateArticleModal />,
            });
          }}
        >
          Create Article
        </Button>
        {/* EoF test */}
      </div>
      <PaginatedArticles />
      {/* <CursorArticles /> */}
      {/* <CursorInfiniteArticles /> */}
    </div>
  );
}
