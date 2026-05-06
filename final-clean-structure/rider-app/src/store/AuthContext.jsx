import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, loginRider, registerRider } from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("rider_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("rider_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const saveSession = (payload) => {
    localStorage.setItem("rider_token", payload.token);
    localStorage.setItem("rider_user", JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
  };

  const login = async (form) => {
    setLoading(true);
    try {
      const res = await loginRider(form);
      saveSession(res.data.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (form) => {
    setLoading(true);
    try {
      const res = await registerRider(form);
      saveSession(res.data.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("rider_token");
    localStorage.removeItem("rider_user");
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!token) return;
    const res = await getProfile();
    setUser(res.data.data);
    localStorage.setItem("rider_user", JSON.stringify(res.data.data));
  };

  useEffect(() => { if (token) refreshProfile().catch(() => logout()); }, []);

  const value = useMemo(() => ({ token, user, loading, login, register, logout, isAuthenticated: Boolean(token) }), [token, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
