import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../store/AuthContext.jsx";

export default function ProtectedRoute() {
  const { isAuthenticated, sessionReady } = useAuth();
  const location = useLocation();

  if (!sessionReady) {
    return (
      <div className="container page">
        <div className="card loading-card">
          <img src="/brand/rider-icon.svg" alt="" />
          <span>Loading rider workspace...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
