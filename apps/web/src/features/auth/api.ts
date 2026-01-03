import { fetcher } from "@/lib/fetcher";
import { Session } from "./types/session";

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

export const logoutAll = () => {
  return fetcher("/auth/logout-all", {
    method: "POST",
  });
};

export const fetchSessions = () => {
  return fetcher<Session[]>("/sessions", {
    method: "GET",
  });
};

export const revokeSession = (sessionId: string) => {
  return fetcher(`/sessions/${sessionId}`, {
    method: "DELETE",
  });
};
