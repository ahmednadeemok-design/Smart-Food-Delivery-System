import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, ClipboardList, Gauge, Headphones, LayoutDashboard, LogIn, LogOut, Megaphone, MenuSquare, ShieldCheck, UserPlus, Utensils } from "lucide-react";
import { useAuth } from "../../store/AuthContext.jsx";
import socket, { connectSocket, disconnectSocket } from "../../services/socket.js";

export default function RestaurantLayout() {
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
    socket.on("connect", () => socket.emit("join-role-rooms"));
    return () => socket.off("connect");
  }, [isAuthenticated, token]);

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <Link className="brand" to="/dashboard">
            <img className="brand-logo" src="/brand/favicon.svg" alt="" />
            <span>SmartFood Restaurant</span>
          </Link>

          <nav className="nav-links">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard"><LayoutDashboard className="nav-icon" />Dashboard</NavLink>
                <NavLink to="/orders"><ClipboardList className="nav-icon" />Orders</NavLink>
                <NavLink to="/menu"><MenuSquare className="nav-icon" />Menu</NavLink>
                <NavLink to="/reports"><BarChart3 className="nav-icon" />Reports</NavLink>
                <NavLink to="/campaigns"><Megaphone className="nav-icon" />Campaigns</NavLink>
                <NavLink to="/support"><Headphones className="nav-icon" />Support</NavLink>
                <NavLink to="/kitchen-load"><Gauge className="nav-icon" />Kitchen</NavLink>
                <NavLink to="/accuracy-reports"><ShieldCheck className="nav-icon" />Accuracy</NavLink>
                <NavLink to="/quality-audit"><Utensils className="nav-icon" />Quality</NavLink>
                <span className="badge role-badge">{user?.role || "restaurant"}</span>
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
          Restaurant Panel - orders, menu, reports, campaigns, support, kitchen load, and quality audit.
        </div>
      </footer>
    </>
  );
}
