import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext.jsx";

export default function AdminLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/users">Users</NavLink>
                <NavLink to="/riders">Riders</NavLink>
                <NavLink to="/restaurants">Restaurants</NavLink>
                <NavLink to="/orders">Orders</NavLink>
                <NavLink to="/complaints">Complaints</NavLink>
                <NavLink to="/refunds">Refunds</NavLink>
                <NavLink to="/trust-scores">Trust</NavLink>
                <NavLink to="/analytics">Analytics</NavLink>
                <NavLink to="/system-health">Health</NavLink>
                <span className="badge">{user?.role || "admin"}</span>
                <button className="btn outline" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <Link className="btn" to="/register">Register</Link>
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
