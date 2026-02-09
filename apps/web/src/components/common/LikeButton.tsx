import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";

interface LikeButtonProps {
  isOwner: boolean;
  likedByMe: boolean;
  likeCount: number;
  onLike: () => void;
}

export function LikeButton({
  isOwner,
  likedByMe,
  likeCount,
  onLike,
}: LikeButtonProps) {
  if (!isOwner) {
    return (
      <div className="flex gap-1 items-center">
        <Button variant="ghost">
          <ThumbsUp />
        </Button>
        {likeCount}
      </div>
    );
  }

  if (likedByMe) {
    return (
      <div className="flex gap-1 items-center">
        <Button
          variant="ghost"
          onClick={onLike}
          className="cursor-pointer transition-transform hover:scale-110"
        >
          <ThumbsUp fill="#000000" color="#000000" />
        </Button>
        {likeCount}
      </div>
    );
  }

  return (
    <div className="flex gap-1 items-center">
      <Button
        variant="ghost"
        onClick={onLike}
        className="cursor-pointer transition-transform hover:scale-110"
      >
        <ThumbsUp />
      </Button>
      {likeCount}
    </div>
  );
}
