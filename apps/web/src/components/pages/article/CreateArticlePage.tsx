"use client";

import { CreateArticleForm } from "@/features/articles/components/CreateArticleForm";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function CreateArticlePage() {
  return (
    <Card className="p-8 w-full max-w-md mx-auto">
      <CreateArticleForm
        isAlwaysOpen
        onSuccess={() => toast.success("Article created")}
      />
    </Card>
  );
}
