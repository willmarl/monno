import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Header() {
  return (
    <header className="bg-sidebar text-sidebar-foreground p-4 flex gap-3 justify-between">
      <Link href={"/"} className="text-2xl font-bold">
        Monno
      </Link>
      <ThemeToggle />
    </header>
  );
}
