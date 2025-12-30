import { ThemeToggle } from "@/components/theme/ThemeToggle";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-sidebar text-sidebar-foreground p-4">
      <Link href={"/"} className="text-2xl font-bold">
        Monno
      </Link>
      <ThemeToggle />
    </header>
  );
}
