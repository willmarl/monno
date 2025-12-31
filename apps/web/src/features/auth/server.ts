import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  return user;
}

export async function getServerUser() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
    method: "GET",
    headers: {
      Cookie: cookieHeader,
    },
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401) {
    // Try refresh
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { Cookie: cookieHeader },
      credentials: "include",
    });

    // Retry /users/me
    res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: { Cookie: cookieHeader },
      credentials: "include",
      cache: "no-store",
    });
  }

  const json = await res.json();

  if (!json.success) return null;

  return json.data;
}

export async function redirectIfLoggedIn() {
  const user = await getServerUser();
  if (user) redirect("/");
}
