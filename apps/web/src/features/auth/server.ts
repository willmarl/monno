// server.ts  (updated version)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  return user;
}

export async function getServerUser() {
  const cookieStore = await cookies();
  let cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
    method: "GET",
    headers: { Cookie: cookieHeader },
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401) {
    // Try refresh
    const refreshRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {
        method: "POST",
        headers: { Cookie: cookieHeader },
        credentials: "include",
      },
    );

    if (refreshRes.ok) {
      // Extract the NEW cookies the backend just set
      const setCookies = refreshRes.headers.getSetCookie?.() || [];
      const newCookieParts = setCookies.map((c) => c.split(";")[0]); // "name=value"

      // Merge old + new (new values win for same name)
      const allCookies = new Map<string, string>();
      cookieHeader.split("; ").forEach((part) => {
        if (part) {
          const [name] = part.split("=");
          allCookies.set(name, part);
        }
      });
      newCookieParts.forEach((part) => {
        if (part) {
          const [name] = part.split("=");
          allCookies.set(name, part);
        }
      });

      cookieHeader = Array.from(allCookies.values()).join("; ");
    }

    // Retry /users/me with the fresh cookies
    res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      credentials: "include",
      cache: "no-store",
    });
  }

  if (!res.ok) return null;

  const json = await res.json();
  return json.success ? json.data : null;
}

export async function redirectIfLoggedIn() {
  const user = await getServerUser();
  if (user) redirect("/");
}
