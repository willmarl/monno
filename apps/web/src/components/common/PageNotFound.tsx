import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageNotFoundProps {
  title: string;
  description?: string;
}

export function PageNotFound({
  title,
  description = "The page you are looking for does not exist.",
}: PageNotFoundProps) {
  return (
    <Card className="p-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </Card>
  );
}
