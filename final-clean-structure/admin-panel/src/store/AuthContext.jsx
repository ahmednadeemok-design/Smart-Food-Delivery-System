import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, loginAdmin, registerAdmin } from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("admin_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const saveSession = (payload) => {
    localStorage.setItem("admin_token", payload.token);
    localStorage.setItem("admin_user", JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
  };

  const login = async (form) => {
    setLoading(true);
    try {
      const res = await loginAdmin(form);
      saveSession(res.data.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (form) => {
    setLoading(true);
    try {
      const res = await registerAdmin(form);
      saveSession(res.data.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!token) return;
    const res = await getProfile();
    setUser(res.data.data);
    localStorage.setItem("admin_user", JSON.stringify(res.data.data));
  };

  useEffect(() => { if (token) refreshProfile().catch(() => logout()); }, []);

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout, isAuthenticated: Boolean(token) }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
