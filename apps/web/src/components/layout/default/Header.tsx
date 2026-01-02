"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { useLogout } from "@/features/auth/hooks";
import { UserAvatar } from "./UserAvatar";
import { User } from "@/features/users/types/user";

export default function Header({ user }: { user: User | null }) {
  const router = useRouter();
  const logout = useLogout();

  function LoggedIn() {
    if (!user) return null;

    const handleProfile = () => {
      router.push("/profile");
    };

    const handleLogout = () => {
      logout.mutate();
    };

    return (
      <DropdownMenu>
        <UserAvatar user={user} />
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">Hello, {user.username}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleProfile}>Profile</DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="text-red-500">
            Logout
            <LogOut className="mr-2 h-4 w-4" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function Guest() {
    return (
      <div className="flex gap-1 items-center">
        <Link href="/login">
          <Button variant={"outline"}>Login</Button>
        </Link>
        <Link href="/register">
          <Button>Register</Button>
        </Link>
      </div>
    );
  }

  return (
    <header className="bg-sidebar text-sidebar-foreground p-4 flex gap-3">
      <Link href={"/"} className="text-2xl font-bold">
        Monno
      </Link>
      <div className="ml-auto flex items-center">
        {user ? LoggedIn() : Guest()}
      </div>
      <ThemeToggle />
    </header>
  );
}
