import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { ClipboardList, History, LayoutDashboard, LogIn, LogOut, PackageCheck, Route, UserPlus } from "lucide-react";
import { useAuth } from "../../store/AuthContext.jsx";
import socket, { connectSocket, disconnectSocket } from "../../services/socket.js";

export default function RiderLayout() {
  const { token, user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (!isAuthenticated || !token) return undefined;
    connectSocket(token);
    const handleConnect = () => socket.emit("join-role-rooms");
    socket.on("connect", handleConnect);
    return () => socket.off("connect", handleConnect);
  }, [isAuthenticated, token]);

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <Link className="brand" to="/dashboard">
            <img className="brand-logo" src="/brand/rider-icon.svg" alt="" />
            <span>SmartFood Rider</span>
          </Link>
          <nav className="nav-links">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard"><LayoutDashboard className="nav-icon" />Dashboard</NavLink>
                <NavLink to="/available-orders"><ClipboardList className="nav-icon" />Orders</NavLink>
                <NavLink to="/active-delivery"><PackageCheck className="nav-icon" />Active</NavLink>
                <NavLink to="/history"><History className="nav-icon" />History</NavLink>
                <NavLink to="/multi-order-route"><Route className="nav-icon" />Route</NavLink>
                <span className="badge role-badge"><span className="status-dot" />{user?.role || "rider"}</span>
                <button className="btn outline" onClick={handleLogout}><LogOut className="nav-icon" />Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/login"><LogIn className="nav-icon" />Login</NavLink>
                <Link className="btn" to="/register"><UserPlus className="nav-icon" />Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="footer"><div className="container">Rider App — workload balancing, multi-order routing, OTP verification.</div></footer>
    </>
  );
}
