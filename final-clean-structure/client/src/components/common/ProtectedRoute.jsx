import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../store/AuthContext.jsx";
import Loading from "./Loading.jsx";

export default function ProtectedRoute() {
  const { isAuthenticated, sessionReady } = useAuth();
  const location = useLocation();

  if (!sessionReady) return <Loading />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
