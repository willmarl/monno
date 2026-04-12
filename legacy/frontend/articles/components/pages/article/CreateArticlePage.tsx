import { CreateArticleForm } from "@/features/articles/components/CreateArticleForm";
import { Card } from "@/components/ui/card";

export function CreateArticlePage() {
  return (
    <Card className="p-8 w-full max-w-md mx-auto">
      <CreateArticleForm />
    </Card>
  );
}
