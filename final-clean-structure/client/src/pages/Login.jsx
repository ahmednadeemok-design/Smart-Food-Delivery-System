import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";
import { forgotPassword, resetPassword } from "../services/authService.js";

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email.trim());

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [reset, setReset] = useState({ token: "", password: "" });
  const [resetMode, setResetMode] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isValidEmail(form.email)) return setError("Please enter a valid email address.");
    if (!form.password) return setError("Password is required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    try {
      await login(form);
      navigate("/restaurants");
    } catch (err) {
      setError(err.message);
    }
  };

  const requestReset = async () => {
    setError("");
    if (!isValidEmail(form.email)) return setError("Please enter a valid email address.");
    try {
      const res = await forgotPassword({ email: form.email });
      setResetMode(true);
      if (res.data.data?.demoResetCode) setReset({ ...reset, token: res.data.data.demoResetCode });
    } catch (err) {
      setError(err.message);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError("");
    if (!isValidEmail(form.email)) return setError("Please enter a valid email address.");
    if (!reset.password) return setError("Password is required.");
    if (reset.password.length < 6) return setError("Password must be at least 6 characters.");
    try {
      await resetPassword({ email: form.email, token: reset.token, password: reset.password });
      setResetMode(false);
      setError("Password reset. You can log in now.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <form className="card form" onSubmit={resetMode ? submitReset : submit}>
          <span className="badge">SmartFood Narowal</span>
          <h2>Welcome back</h2>
          <p className="muted">Log in to order from Narowal restaurants.</p>
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {resetMode ? (
            <>
              <input className="input" placeholder="Reset code" value={reset.token} onChange={(e) => setReset({ ...reset, token: e.target.value })} />
              <input className="input" type="password" placeholder="New password" value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} />
              <button className="btn">Reset Password</button>
            </>
          ) : (
            <>
              <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button className="btn" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
              <button className="btn outline" type="button" onClick={requestReset}>Forgot Password</button>
            </>
          )}
          <p className="muted">No account? <Link to="/register">Register here</Link></p>
        </form>
      </div>
    </section>
  );
}
