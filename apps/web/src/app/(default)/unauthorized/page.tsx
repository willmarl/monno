import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unauthorized",
};
export default function UnauthorizedPage() {
  return (
    <div className="flex justify-center min-h-screen m-8">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Lock className="w-16 h-16" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-2">Unauthorized</h1>

        <p className="text-lg text-muted-foreground mb-8">
          You don't have permission to view or edit this content.
        </p>

        <Link href="/">
          <Button className="cursor-pointer">Return to Home</Button>
        </Link>
      </div>
    </div>
  );
}
