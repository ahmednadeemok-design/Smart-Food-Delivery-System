import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";
import { forgotPassword, resetPassword } from "../services/authService.js";

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email.trim());

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [reset, setReset] = useState({ token: "", password: "", confirmPassword: "" });
  const [authMode, setAuthMode] = useState("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
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
    setMessage("");
    if (!isValidEmail(form.email)) return setError("Please enter a valid email address.");
    try {
      await forgotPassword({ email: form.email });
      setAuthMode("reset");
      setMessage("If this email exists, a reset code has been sent.");
    } catch (err) {
      setError("Unable to request a reset code right now. Please try again.");
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!isValidEmail(form.email)) return setError("Please enter a valid email address.");
    if (!reset.token.trim()) return setError("Reset code is required.");
    if (!reset.password) return setError("Password is required.");
    if (reset.password.length < 6) return setError("Password must be at least 6 characters.");
    if (reset.password !== reset.confirmPassword) return setError("Passwords do not match.");
    try {
      await resetPassword({ email: form.email, token: reset.token, password: reset.password });
      setAuthMode("login");
      setReset({ token: "", password: "", confirmPassword: "" });
      setMessage("Password reset successfully. You can now login.");
    } catch (err) {
      setError(err.message?.includes("Invalid") ? "Invalid or expired reset code. Please request a new one." : "Unable to reset password. Please try again.");
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <form className="card form" onSubmit={authMode === "reset" ? submitReset : submit}>
          <img className="auth-brand-logo" src="/brand/logo.svg" alt="SmartFood Narowal" />
          <span className="badge">SmartFood Narowal</span>
          <h2>{authMode === "forgot" ? "Forgot password" : authMode === "reset" ? "Reset password" : "Welcome back"}</h2>
          <p className="muted">
            {authMode === "forgot" && "Enter your email and we will send a reset code."}
            {authMode === "reset" && "Enter the reset code from your email and choose a new password."}
            {authMode === "login" && "Log in to order from Narowal restaurants."}
          </p>
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          {message && <p style={{ color: "var(--success)" }}>{message}</p>}
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {authMode === "forgot" ? (
            <>
              <button className="btn" type="button" onClick={requestReset}>Send reset code</button>
              <button className="btn outline" type="button" onClick={() => setAuthMode("login")}>Back to login</button>
            </>
          ) : authMode === "reset" ? (
            <>
              <input className="input" placeholder="Reset code" value={reset.token} onChange={(e) => setReset({ ...reset, token: e.target.value })} />
              <input className="input" type="password" placeholder="New password" value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} />
              <input className="input" type="password" placeholder="Confirm password" value={reset.confirmPassword} onChange={(e) => setReset({ ...reset, confirmPassword: e.target.value })} />
              <button className="btn">Reset Password</button>
              <button className="btn outline" type="button" onClick={() => setAuthMode("forgot")}>Request a new code</button>
            </>
          ) : (
            <>
              <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button className="btn" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
              <button className="btn outline" type="button" onClick={() => setAuthMode("forgot")}>Forgot Password</button>
            </>
          )}
          {authMode === "login" && <p className="muted">No account? <Link to="/register">Register here</Link></p>}
        </form>
      </div>
    </section>
  );
}
