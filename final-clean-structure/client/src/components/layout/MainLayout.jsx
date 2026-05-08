import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
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
          <Link className="brand" to="/">
            <img className="brand-logo" src="/brand/favicon.svg" alt="" />
            <span>SmartFood Narowal</span>
          </Link>

          <nav className="nav-links">
            <NavLink to="/restaurants">Restaurants</NavLink>
            <NavLink to="/cart">Cart</NavLink>
            <NavLink to="/orders">Orders</NavLink>
            <NavLink to="/profile">Profile</NavLink>
            <NavLink to="/health">Health</NavLink>
            <NavLink to="/subscription">Subscription</NavLink>

            {isAuthenticated ? (
              <>
                <span className="badge">{user?.loyalty?.badge || "Bronze"} - {user?.loyalty?.points || 0} pts</span>
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
