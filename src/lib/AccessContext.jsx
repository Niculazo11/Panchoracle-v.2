import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { api, AUTH_EXPIRED_EVENT } from "./api.js";

export const AccessContext = createContext(null);
const ANON = { status: "anonymous", user: null };

export function AccessProvider({ children }) {
  const [state, setState] = useState({ status: "checking", user: null });

  useEffect(() => {
    const controller = new AbortController();
    api.get("/me", { signal: controller.signal })
      .then(({ user }) => setState({ status: "authenticated", user }))
      .catch((error) => { if (error.name !== "AbortError") setState(ANON); });

    // UN-201 RF-6 / ADR 5.2: cualquier 401 cierra la sesión del cliente.
    const onExpired = () => setState(ANON);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => {
      controller.abort();
      window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { user } = await api.post("/auth/login", { email, password });
    setState({ status: "authenticated", user });
    return user;
  }, []);

  const register = useCallback(async (payload) => {
    const { user } = await api.post("/auth/register", payload);
    setState({ status: "authenticated", user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout").catch(() => {});
    setState(ANON);
  }, []);

  const value = useMemo(
    () => ({ ...state, role: state.user?.role ?? null, login, register, logout }),
    [state, login, register, logout]
  );
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}