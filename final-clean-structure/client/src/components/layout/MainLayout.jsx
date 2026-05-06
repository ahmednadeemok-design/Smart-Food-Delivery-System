import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext.jsx";

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <Link className="brand" to="/">SmartFood AI</Link>

          <nav className="nav-links">
            <Link to="/restaurants">Restaurants</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/health">Health</Link>
            <Link to="/subscription">Subscription</Link>

            {isAuthenticated ? (
              <>
                <span className="badge">{user?.role || "customer"}</span>
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

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          Smart Food Delivery System — AI Recommendation, OTP Delivery, Complaint AI, Health Tracking.
        </div>
      </footer>
    </>
  );
}
