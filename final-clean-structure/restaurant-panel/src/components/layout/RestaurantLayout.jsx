import { Link, Outlet, useNavigate } from "react-router-dom";
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
          <Link className="brand" to="/dashboard">SmartFood Restaurant</Link>

          <nav className="nav-links">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/orders">Orders</Link>
                <Link to="/menu">Menu</Link>
                <Link to="/kitchen-load">Kitchen Load</Link>
                <Link to="/accuracy-reports">Accuracy</Link>
                <Link to="/quality-audit">Quality</Link>
                <span className="badge">{user?.role || "restaurant"}</span>
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
          Restaurant Panel — order management, kitchen load, accuracy prediction, and quality audit.
        </div>
      </footer>
    </>
  );
}
