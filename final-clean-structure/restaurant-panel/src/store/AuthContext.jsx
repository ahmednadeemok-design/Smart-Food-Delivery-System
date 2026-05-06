import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, loginRestaurantUser, registerRestaurantUser } from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("restaurant_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("restaurant_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const saveSession = (payload) => {
    localStorage.setItem("restaurant_token", payload.token);
    localStorage.setItem("restaurant_user", JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
  };

  const login = async (form) => {
    setLoading(true);
    try {
      const res = await loginRestaurantUser(form);
      saveSession(res.data.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (form) => {
    setLoading(true);
    try {
      const res = await registerRestaurantUser(form);
      saveSession(res.data.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("restaurant_token");
    localStorage.removeItem("restaurant_user");
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!token) return;
    const res = await getProfile();
    setUser(res.data.data);
    localStorage.setItem("restaurant_user", JSON.stringify(res.data.data));
  };

  useEffect(() => { if (token) refreshProfile().catch(() => logout()); }, []);

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout, isAuthenticated: Boolean(token) }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
