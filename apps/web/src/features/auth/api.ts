import { fetcher } from "@/lib/fetcher";

export const login = (payload: { username: string; password: string }) => {
  return fetcher("/auth/login", {
    method: "POST",
    json: payload,
  });
};

export const register = (payload: {
  username: string;
  email?: string;
  password: string;
}) => {
  return fetcher("/auth/register", {
    method: "POST",
    json: payload,
  });
};

export const logout = () => {
  return fetcher("/auth/logout", {
    method: "POST",
  });
};
