import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../store/AuthContext.jsx";

export default function ProtectedRoute() {
  return useAuth().isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
