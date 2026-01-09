"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Postlist } from "@/components/pages/default/Postlist";

export default function page() {
  const router = useRouter();

  return (
    <div>
      <div className="flex justify-center relative items-center h-10 mb-4">
        <div className="border border-green-400">Search bar here</div>
        <Button
          className="cursor-pointer absolute right-0"
          onClick={() => router.push("/posts/create")}
        >
          <Plus /> Post
        </Button>
      </div>
      <Postlist />
    </div>
  );
}
