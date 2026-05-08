import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext.jsx";

export default function RestaurantLayout() {
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
            <span>SmartFood Restaurant</span>
          </Link>

          <nav className="nav-links">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/orders">Orders</NavLink>
                <NavLink to="/menu">Menu</NavLink>
                <NavLink to="/reports">Reports</NavLink>
                <NavLink to="/campaigns">Campaigns</NavLink>
                <NavLink to="/support">Support</NavLink>
                <NavLink to="/kitchen-load">Kitchen Load</NavLink>
                <NavLink to="/accuracy-reports">Accuracy</NavLink>
                <NavLink to="/quality-audit">Quality</NavLink>
                <span className="badge">{user?.role || "restaurant"}</span>
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
          Restaurant Panel - orders, menu, reports, campaigns, support, kitchen load, and quality audit.
        </div>
      </footer>
    </>
  );
}
