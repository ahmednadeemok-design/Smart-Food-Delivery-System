import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, loginRider, registerRider } from "../services/authService.js";

const AuthContext = createContext(null);
const tokenKey = "rider_token";
const userKey = "rider_user";
const expectedRole = "rider";

const readSavedUser = () => {
  try {
    const saved = localStorage.getItem(userKey);
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem(userKey);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey));
  const [user, setUser] = useState(readSavedUser);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    setToken(null);
    setUser(null);
  }, []);

  const saveSession = useCallback((payload) => {
    if (!payload?.token || !payload?.user) throw new Error("Invalid authentication response");
    if (payload.user.role !== expectedRole) throw new Error("Please use the correct portal for this account role");

    localStorage.setItem(tokenKey, payload.token);
    localStorage.setItem(userKey, JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
  }, []);

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

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem(tokenKey)) return;
    const res = await getProfile();
    const profile = res.data.data;
    if (profile.role !== expectedRole) throw new Error("Invalid role for this portal");
    setUser(profile);
    localStorage.setItem(userKey, JSON.stringify(profile));
  }, []);

  useEffect(() => {
    refreshProfile()
      .catch(logout)
      .finally(() => setSessionReady(true));
  }, [logout, refreshProfile]);

  useEffect(() => {
    window.addEventListener("auth:logout", logout);
    return () => window.removeEventListener("auth:logout", logout);
  }, [logout]);

  const value = useMemo(
    () => ({ token, user, loading, sessionReady, login, register, logout, refreshProfile, isAuthenticated: Boolean(token && user?.role === expectedRole) }),
    [token, user, loading, sessionReady, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
