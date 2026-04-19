import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/features/auth/hooks";
import { FolderPlus } from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";
import { ModifyCollectionItemModal } from "@/features/collections/components/modal/ModifyCollectionItemModal";
import { AuthModal } from "@/features/auth/components/modal/AuthModal";
import { ResourceType } from "@/types/resource";

interface CollectionButtonProps {
  resourceId: number;
  resourceType: ResourceType;
}

export function CollectionButton({
  resourceId,
  resourceType,
}: CollectionButtonProps) {
  const { data: user } = useSessionUser();
  const { openModal } = useModal();

  const handleClick = () => {
    if (!user) {
      openModal({
        title: "",
        content: <AuthModal title="Login to save to a collection" />,
      });
      return;
    }
    openModal({
      title: "Add to collection",
      content: (
        <ModifyCollectionItemModal
          resourceId={resourceId}
          resourceType={resourceType}
        />
      ),
    });
  };

  return (
    <Button
      variant="ghost"
      className="cursor-pointer flex items-center justify-center"
      onClick={handleClick}
      title="Add to collection"
    >
      <FolderPlus className="h-5 w-5" />
    </Button>
  );
}
