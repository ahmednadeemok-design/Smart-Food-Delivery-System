import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext.jsx";

export default function RiderLayout() {
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
          <Link className="brand" to="/dashboard">SmartFood Rider</Link>
          <nav className="nav-links">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/available-orders">Orders</Link>
                <Link to="/active-delivery">Active</Link>
                <Link to="/multi-order-route">Route</Link>
                <Link to="/delivery-verification">OTP</Link>
                <span className="badge"><span className="status-dot" />{user?.role || "rider"}</span>
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
      <footer className="footer"><div className="container">Rider App — workload balancing, multi-order routing, OTP verification.</div></footer>
    </>
  );
}
