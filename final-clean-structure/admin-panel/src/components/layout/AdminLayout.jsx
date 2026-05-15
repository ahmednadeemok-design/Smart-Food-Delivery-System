import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Activity, BarChart3, Bike, ClipboardList, Gauge, Landmark, LayoutDashboard, LogIn, LogOut, ReceiptText, ShieldCheck, Store, UserCog, UserPlus, Users } from "lucide-react";
import { useAuth } from "../../store/AuthContext.jsx";
import socket, { connectSocket, disconnectSocket } from "../../services/socket.js";

export default function AdminLayout() {
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
            <img className="brand-logo" src="/brand/favicon.svg" alt="" />
            <span>SmartFood Admin</span>
          </Link>

          <nav className="nav-links">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard"><LayoutDashboard className="nav-icon" />Dashboard</NavLink>
                <NavLink to="/users"><Users className="nav-icon" />Users</NavLink>
                <NavLink to="/riders"><Bike className="nav-icon" />Riders</NavLink>
                <NavLink to="/restaurants"><Store className="nav-icon" />Restaurants</NavLink>
                <NavLink to="/orders"><ReceiptText className="nav-icon" />Orders</NavLink>
                <NavLink to="/complaints"><ClipboardList className="nav-icon" />Complaints</NavLink>
                <NavLink to="/refunds"><UserCog className="nav-icon" />Refunds</NavLink>
                <NavLink to="/finance"><Landmark className="nav-icon" />Finance</NavLink>
                <NavLink to="/trust-scores"><ShieldCheck className="nav-icon" />Trust</NavLink>
                <NavLink to="/analytics"><BarChart3 className="nav-icon" />Analytics</NavLink>
                <NavLink to="/system-health"><Activity className="nav-icon" />Health</NavLink>
                <span className="badge role-badge"><Gauge className="nav-icon" />{user?.role || "admin"}</span>
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

      <footer className="footer">
        <div className="container">
          Admin Panel — platform monitoring, complaints, refunds, trust score, and analytics.
        </div>
      </footer>
    </>
  );
}
