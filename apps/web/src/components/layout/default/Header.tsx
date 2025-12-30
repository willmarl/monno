import Link from "next/link";
// import web icon and add to header
export default function Header() {
  return (
    <header className="bg-gray-800 text-white p-4">
      <Link href={"/"} className="text-2xl font-bold">
        Monno
      </Link>
    </header>
  );
}
