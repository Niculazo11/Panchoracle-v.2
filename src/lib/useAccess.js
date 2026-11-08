import { useState, useEffect, useCallback } from "react";
import { api } from "./api.js";

// ---------------------------------------------------------------
// TEMPORARY DEV SHORTCUT. Delete this block (and the places marked
// "DEV") when the real login/register endpoints (UN-104) exist.
// It only works with `npm run dev`; it is off in a production build.
// ---------------------------------------------------------------
const DEV_USER_KEY = "devUser";

function readDevUser() {
  if (!import.meta.env.DEV) return null;
  try {
    const saved = localStorage.getItem(DEV_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveDevUser(email) {
  const user = { id: "dev-user", name: email.split("@")[0], email, role: "student" };
  try {
    localStorage.setItem(DEV_USER_KEY, JSON.stringify(user));
  } catch {
    // storage unavailable: the fake session just won't survive a reload
  }
  return user;
}

function clearDevUser() {
  try {
    localStorage.removeItem(DEV_USER_KEY);
  } catch {
    // nothing to do
  }
}
// ---------------------------------------------------------------

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

        // DEV: no server session, so use the fake one if it exists.
        const devUser = readDevUser();
        if (devUser) {
          setStatus("authenticated");
          setUser(devUser);
          setRole(devUser.role);
        } else {
          setStatus("anonymous");
        }
      });
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    let loggedUser;
    try {
      const data = await api.post("/auth/login", { email, password });
      loggedUser = data.user;
    } catch (error) {
      // DEV: if the server is missing or has no such route, fake the login.
      // A real rejection (400/401) is still shown as an error.
      if (!import.meta.env.DEV || error.status === 400 || error.status === 401) {
        throw error;
      }
      loggedUser = saveDevUser(email);
    }

    setStatus("authenticated");
    setUser(loggedUser);
    setRole(loggedUser.role);
    return { token: null, user: loggedUser };
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout").catch(() => {});
    clearDevUser(); // DEV
    setStatus("anonymous");
    setUser(null);
    setRole(null);
  }, []);

  return { status, user, role, login, logout };
}