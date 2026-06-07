import { api } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
}

const TOKEN_KEY = "blc_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
    email,
    password,
  });
  setToken(data.token);
  return data.user;
}

export function logout() {
  removeToken();
  window.location.href = "/login";
}
