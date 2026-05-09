import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { HeartPulse, Home, LogIn, LogOut, ReceiptText, ShoppingCart, Store, User, UserPlus } from "lucide-react";
import { useAuth } from "../../store/AuthContext.jsx";
import socket, { connectSocket, disconnectSocket } from "../../services/socket.js";

export default function MainLayout() {
  const { token, user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate("/");
  };

  useEffect(() => {
    if (!isAuthenticated || !token) return undefined;
    connectSocket(token);
    socket.on("connect", () => socket.emit("join-role-rooms"));
    return () => {
      socket.off("connect");
    };
  }, [isAuthenticated, token]);

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <Link className="brand" to="/">
            <img className="brand-logo" src="/brand/favicon.svg" alt="" />
            <span>SmartFood Narowal</span>
          </Link>

          <nav className="nav-links">
            <NavLink to="/restaurants"><Store className="nav-icon" />Restaurants</NavLink>
            <NavLink to="/cart"><ShoppingCart className="nav-icon" />Cart</NavLink>
            <NavLink to="/orders"><ReceiptText className="nav-icon" />Orders</NavLink>
            <NavLink to="/profile"><User className="nav-icon" />Profile</NavLink>
            <NavLink to="/health"><HeartPulse className="nav-icon" />Health</NavLink>
            <NavLink to="/subscription"><Home className="nav-icon" />Plan</NavLink>

            {isAuthenticated ? (
              <>
                <span className="badge role-badge">Customer / {user?.loyalty?.badge || "Bronze"} - {user?.loyalty?.points || 0} pts</span>
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

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          SmartFood Narowal - COD delivery, OTP verification, rider tracking, loyalty, and local restaurant operations.
        </div>
      </footer>
    </>
  );
}
