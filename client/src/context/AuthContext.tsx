/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { api, sessionStorageKey } from "../lib/api";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): AuthState {
  try {
    const value = JSON.parse(localStorage.getItem(sessionStorageKey) || "null") as AuthState | null;
    return value?.token && value.user ? value : { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthState>(readSession);

  const saveSession = useCallback((next: AuthState) => {
    setSession(next);
    if (next.token) localStorage.setItem(sessionStorageKey, JSON.stringify(next));
    else localStorage.removeItem(sessionStorageKey);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveSession(response.data);
    return response.data.user;
  }, [saveSession]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await api<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    saveSession(response.data);
    return response.data.user;
  }, [saveSession]);

  const logout = useCallback(() => saveSession({ user: null, token: null }), [saveSession]);
  const value = useMemo(() => ({ ...session, login, register, logout }), [session, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
