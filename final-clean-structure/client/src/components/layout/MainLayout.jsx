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
          <Link className="brand" to="/">SmartFood Narowal</Link>

          <nav className="nav-links">
            <Link to="/restaurants">Restaurants</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/health">Health</Link>
            <Link to="/subscription">Subscription</Link>

            {isAuthenticated ? (
              <>
                <span className="badge">{user?.loyalty?.badge || "Bronze"} - {user?.loyalty?.points || 0} pts</span>
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
          SmartFood Narowal - COD delivery, OTP verification, rider tracking, loyalty, and local restaurant operations.
        </div>
      </footer>
    </>
  );
}
