"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { useSessionUser } from "@/features/auth/hooks";

export default function Header() {
  const { data: user } = useSessionUser();

  function LoggedIn() {
    if (!user) return null;

    const handleProfile = () => {
      console.log("Profile clicked");
      // TODO: Navigate to profile page
    };

    const handleLogout = () => {
      console.log("Logout clicked");
      // TODO: Implement logout logic
    };

    return (
      <DropdownMenu>
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
        <Button variant={"outline"}>Login</Button>
        <Button>Register</Button>
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
