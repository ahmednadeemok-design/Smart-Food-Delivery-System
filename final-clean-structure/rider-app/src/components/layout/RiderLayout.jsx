import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
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
          <Link className="brand" to="/dashboard">
            <img className="brand-logo" src="/brand/rider-icon.svg" alt="" />
            <span>SmartFood Rider</span>
          </Link>
          <nav className="nav-links">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/available-orders">Orders</NavLink>
                <NavLink to="/active-delivery">Active</NavLink>
                <NavLink to="/history">History</NavLink>
                <NavLink to="/multi-order-route">Route</NavLink>
                <NavLink to="/delivery-verification">OTP</NavLink>
                <span className="badge"><span className="status-dot" />{user?.role || "rider"}</span>
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
      <footer className="footer"><div className="container">Rider App — workload balancing, multi-order routing, OTP verification.</div></footer>
    </>
  );
}
