import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  // status: "checking" | "authenticated" | "unauthenticated"
  const [state, setState] = useState({ status: "checking", email: null });

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      setState(session ? { status: "authenticated", email: session.user.email } : { status: "unauthenticated", email: null });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? { status: "authenticated", email: session.user.email } : { status: "unauthenticated", email: null });
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    setState({ status: "authenticated", email: data.user.email });
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ status: "unauthenticated", email: null });
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
