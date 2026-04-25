"use client";

import { PaginatedArticles } from "./PaginatedArticles";
import { CursorArticles } from "./CursorArticles";
import { CursorInfiniteArticles } from "./CursorInfiniteArticles";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/ModalProvider";
import { CreateArticleModal } from "@/features/articles/components/modal/CreateArticleModal";
import { User } from "@/features/users/types/user";
import { ArticleSearchBar } from "@/features/articles/components/ArticleSearchBar";
import { PublicArticleSearchParams } from "@/types/search-params";

interface ArticlePageProps {
  user: User | null;
  searchParams?: PublicArticleSearchParams;
}

export function ArticlePage({ user, searchParams }: ArticlePageProps) {
  const router = useRouter();

  const { openModal } = useModal();

  return (
    <div>
      <div className="flex justify-center relative items-center h-10 mb-4">
        <ArticleSearchBar />
        {user ? (
          <div>
            <Button
              className="cursor-pointer absolute right-0"
              onClick={() => router.push("/article/create")}
            >
              <Plus /> Article
              {/* test inline forms work. remove this button after test */}
            </Button>
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
            {/* EoL test */}
          </div>
        ) : (
          ""
        )}
      </div>
      <PaginatedArticles searchParams={searchParams} />
      {/* <CursorArticles searchParams={searchParams} /> */}
      {/* <CursorInfiniteArticles searchParams={searchParams} /> */}
    </div>
  );
}
