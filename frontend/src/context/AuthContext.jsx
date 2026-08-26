import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("lh_user");
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  useEffect(() => {
    const t = localStorage.getItem("lh_token");
    const u = localStorage.getItem("lh_user");

    if (!t && !u) {
      setUser(false);
      return;
    }

    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {}
    }

    api
      .get("/auth/me")
      .then((r) => {
        if (r.data && typeof r.data === "object") {
          setUser(r.data);
          localStorage.setItem("lh_user", JSON.stringify(r.data));
        }
      })
      .catch(() => {
        // If we already have a saved session in localStorage, preserve it
        const fallback = localStorage.getItem("lh_user");
        if (!fallback) {
          localStorage.removeItem("lh_token");
          setUser(false);
        }
      });
  }, []);

  const login = async (identifier, password) => {
    const { data } = await api.post("/auth/login", { identifier, password });
    if (data?.access_token) localStorage.setItem("lh_token", data.access_token);
    if (data?.user) {
      localStorage.setItem("lh_user", JSON.stringify(data.user));
      setUser(data.user);
    }
    return data?.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("lh_token");
    localStorage.removeItem("lh_user");
    localStorage.removeItem("lh_current_user");
    setUser(false);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
