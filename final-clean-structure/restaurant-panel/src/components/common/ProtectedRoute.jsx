import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../store/AuthContext.jsx";

export default function ProtectedRoute() {
  const { isAuthenticated, sessionReady } = useAuth();
  const location = useLocation();

  if (!sessionReady) return <div className="container page">Loading...</div>;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
