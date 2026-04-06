import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/features/auth/hooks";
import { ThumbsUp } from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";
import { AuthModal } from "@/features/auth/components/modal/AuthModal";

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
  const { data: user } = useSessionUser();
  const { openModal } = useModal();

  const buttonClassName = "cursor-pointer transition-transform hover:scale-110";

  const handleLikeClick = () => {
    if (!user) {
      openModal({
        title: "",
        content: <AuthModal title="Login to like a post" />,
      });
      return;
    }
    onLike();
  };

  if (!isOwner && !likedByMe) {
    return (
      <div className="flex gap-1 items-center" data-testid="like-count">
        <Button
          variant="ghost"
          onClick={handleLikeClick}
          className={buttonClassName}
          data-testid="like-button"
        >
          <ThumbsUp />
        </Button>
        {likeCount}
      </div>
    );
  }

  if (!isOwner && likedByMe) {
    return (
      <div className="flex gap-1 items-center" data-testid="like-count">
        <Button
          variant="ghost"
          onClick={handleLikeClick}
          className={buttonClassName}
          data-testid="like-button"
        >
          <ThumbsUp fill="currentColor" className="dark:text-white" />
        </Button>
        {likeCount}
      </div>
    );
  }

  if (likedByMe) {
    return (
      <div className="flex gap-1 items-center" data-testid="like-count">
        <Button
          variant="ghost"
          onClick={handleLikeClick}
          className={buttonClassName}
          data-testid="like-button"
        >
          <ThumbsUp fill="currentColor" className="dark:text-white" />
        </Button>
        {likeCount}
      </div>
    );
  }

  return (
    <div className="flex gap-1 items-center" data-testid="like-count">
      <Button
        variant="ghost"
        onClick={handleLikeClick}
        className={buttonClassName}
        data-testid="like-button"
      >
        <ThumbsUp />
      </Button>
      {likeCount}
    </div>
  );
}
