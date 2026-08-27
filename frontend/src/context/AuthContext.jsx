import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("lh_token");
      const saved = localStorage.getItem("lh_user");
      // Only restore user if a token actually exists
      if (token && saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  useEffect(() => {
    const token = localStorage.getItem("lh_token");

    if (!token) {
      localStorage.removeItem("lh_user");
      localStorage.removeItem("lh_current_user");
      setUser(false);
      return;
    }

    // Validate active token with the live server
    api
      .get("/auth/me")
      .then((r) => {
        if (r.data && typeof r.data === "object") {
          setUser(r.data);
          localStorage.setItem("lh_user", JSON.stringify(r.data));
        } else {
          logout();
        }
      })
      .catch((err) => {
        // If unauthenticated or token expired, wipe stale storage
        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
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

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...updatedFields };
      localStorage.setItem("lh_user", JSON.stringify(next));
      return next;
    });
  };

  return <AuthContext.Provider value={{ user, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
