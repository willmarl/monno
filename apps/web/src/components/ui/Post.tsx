import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

const mockPost = {
  content:
    "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Minus consequatur, unde autem est nostrum incidunt, odio hic veritatis quo eum impedit ratione deleniti harum excepturi vitae cumque! Accusantium, sunt voluptatem?",
  username: "username",
  avatar: "https://github.com/shadcn.png",
};

export function Post() {
  return (
    <Card className="p-4">
      <p className="text-sm text-foreground">{mockPost.content}</p>
      <div className="flex gap-3 items-center">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={mockPost.avatar} alt={mockPost.username} />
          <AvatarFallback>{mockPost.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <p className="text-sm font-medium text-muted-foreground">
          {mockPost.username}
        </p>
      </div>
    </Card>
  );
}
