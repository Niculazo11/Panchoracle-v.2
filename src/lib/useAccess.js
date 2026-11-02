import { useState, useEffect, useCallback } from "react";
import { api } from "./api.js";

export function useAccess() {
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get("/api/auth/me")
      .then(({ user }) => {
        if (mounted) {
          setStatus("authenticated");
          setUser(user);
          setRole(user.role);
        }
      })
      .catch(() => {
        if (mounted) setStatus("anonymous");
      });
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await api.post("/api/auth/login", { email, password });
    setStatus("authenticated");
    setUser(user);
    setRole(user.role);
    return { token, user };
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout").catch(() => {});
    setStatus("anonymous");
    setUser(null);
    setRole(null);
  }, []);

  return { status, user, role, login, logout };
}