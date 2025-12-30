"use client";
import { Post } from "@/components/ui/Post";
import { useParams } from "next/navigation";

export default function page() {
  const params = useParams();
  const id = params.id;
  return (
    <div className="max-w-2xl mx-auto">
      <p>Post ID: {id}</p>
      <Post />
    </div>
  );
}
