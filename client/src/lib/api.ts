import type { ApiResponse } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const SESSION_KEY = "novacare_session_v1";

export class ApiError extends Error {
  status: number;
  errors: Array<{ field: string; message: string }>;

  constructor(message: string, status: number, errors: Array<{ field: string; message: string }> = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function getStoredToken() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null")?.token as string | undefined;
  } catch {
    return undefined;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const payload = (await response.json().catch(() => ({ message: "The server returned an unreadable response" }))) as ApiResponse<T>;
  if (!response.ok) throw new ApiError(payload.message || "Something went wrong", response.status, payload.errors);
  return payload;
}

export const sessionStorageKey = SESSION_KEY;
