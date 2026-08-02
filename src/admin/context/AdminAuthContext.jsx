import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  // status: "checking" | "authenticated" | "unauthenticated"
  const [state, setState] = useState({ status: "checking", email: null });

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { credentials: "include" });
      const data = await res.json();
      setState(data.authenticated ? { status: "authenticated", email: data.email } : { status: "unauthenticated", email: null });
    } catch {
      setState({ status: "unauthenticated", email: null });
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || "Login failed." };
      setState({ status: "authenticated", email: data.email });
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not reach the server. Please try again." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    } finally {
      setState({ status: "unauthenticated", email: null });
    }
  }, []);

  return (
    <AdminAuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
