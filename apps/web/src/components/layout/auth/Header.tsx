import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="bg-sidebar text-sidebar-foreground p-4 flex gap-3 justify-between">
      <Link href={"/"} className="text-2xl font-bold">
        Monno
      </Link>
      <div className="flex gap-1 items-center ml-auto">
        <Link href="/login">
          <Button variant={"outline"}>Login</Button>
        </Link>
        <Link href="/register">
          <Button>Register</Button>
        </Link>
      </div>
      <ThemeToggle />
    </header>
  );
}
