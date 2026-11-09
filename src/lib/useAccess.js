import { useState, useEffect, useCallback } from "react";
import { api } from "./api.js";

export function useAccess() {
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get("/auth/me")
      .then(({ user }) => {
        if (mounted) {
          setStatus("authenticated");
          setUser(user);
          setRole(user.role);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setStatus("anonymous");
      });
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    const loggedUser = data.user;

    setStatus("authenticated");
    setUser(loggedUser);
    setRole(loggedUser.role);
    return { token: null, user: loggedUser };
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout").catch(() => {});
    setStatus("anonymous");
    setUser(null);
    setRole(null);
  }, []);

  return { status, user, role, login, logout };
}