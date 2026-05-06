import { Link, Outlet, useNavigate } from "react-router-dom";
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
          <Link className="brand" to="/dashboard">SmartFood Admin</Link>

          <nav className="nav-links">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/users">Users</Link>
                <Link to="/riders">Riders</Link>
                <Link to="/restaurants">Restaurants</Link>
                <Link to="/complaints">Complaints</Link>
                <Link to="/refunds">Refunds</Link>
                <Link to="/trust-scores">Trust</Link>
                <Link to="/analytics">Analytics</Link>
                <span className="badge">{user?.role || "admin"}</span>
                <button className="btn outline" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
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
