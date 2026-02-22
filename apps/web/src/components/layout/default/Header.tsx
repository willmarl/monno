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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";
import { useLogout } from "@/features/auth/hooks";
import { UserAvatar } from "./UserAvatar";
import { User } from "@/features/users/types/user";

// Feature flag: Set to false if your boilerplate doesn't have Stripe/Credits
const SHOW_ACCOUNT_STATUS = false;

export default function Header({ user }: { user: User | null }) {
  const router = useRouter();
  const logout = useLogout();

  function LoggedIn() {
    if (!user) return null;

    const handleProfile = () => {
      const url = "/user/" + user.username;
      router.push(url);
    };

    const handleSettings = () => {
      router.push("/settings");
    };

    const handleProducts = () => {
      router.push("/purchases");
    };

    const handleLogout = () => {
      logout.mutate();
    };

    return (
      <DropdownMenu>
        <div className="flex gap-2">
          {user.role === "ADMIN" ? (
            <Link href="/admin">
              <Button className="cursor-pointer" variant={"link"}>
                Admin Dashboard
              </Button>
            </Link>
          ) : (
            ""
          )}

          <UserAvatar user={user} />
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">Hello, {user.username}</Button>
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent align="end" className="w-48">
          {SHOW_ACCOUNT_STATUS && (
            <>
              <div className="px-2 py-2 space-y-2">
                <div className="text-sm font-semibold text-muted-foreground">
                  Account Status
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">
                    {user.subscription?.tier || "FREE"}
                  </Badge>
                  <Badge variant="secondary">{user.credits} credits</Badge>
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleProfile}>Profile</DropdownMenuItem>
          <DropdownMenuItem onClick={handleSettings}>Settings</DropdownMenuItem>
          {SHOW_ACCOUNT_STATUS && (
            <DropdownMenuItem onClick={handleProducts}>
              Owned Products
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleLogout} variant="destructive">
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
