import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../services/authService.js";
import { useAuth } from "../store/AuthContext.jsx";

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email.trim());

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [reset, setReset] = useState({ token: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const submit = async (e) => {
    e.preventDefault();
    clearFeedback();
    if (!isValidEmail(form.email)) return setError("Please enter a valid email address.");
    if (!form.password) return setError("Password is required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const requestReset = async () => {
    clearFeedback();
    if (!isValidEmail(form.email)) return setError("Please enter a valid email address.");
    try {
      await forgotPassword({ email: form.email });
      setMode("reset");
      setMessage("If this email exists, a reset code has been sent.");
    } catch {
      setError("Unable to request a reset code right now. Please try again.");
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    clearFeedback();
    if (!isValidEmail(form.email)) return setError("Please enter a valid email address.");
    if (!reset.token.trim()) return setError("Reset code is required.");
    if (reset.password.length < 6) return setError("Password must be at least 6 characters.");
    if (reset.password !== reset.confirmPassword) return setError("Passwords do not match.");
    try {
      await resetPassword({ email: form.email, token: reset.token, password: reset.password });
      setMode("login");
      setReset({ token: "", password: "", confirmPassword: "" });
      setMessage("Password reset successfully. You can now login.");
    } catch (err) {
      setError(err.message?.includes("Invalid") ? "Invalid or expired reset code. Please request a new one." : "Unable to reset password. Please try again.");
    }
  };

  return (
    <section className="page">
      <div className="container" style={{ maxWidth: 460 }}>
        <form className="card form" onSubmit={mode === "reset" ? submitReset : submit}>
          <img className="auth-brand-logo" src="/brand/logo.svg" alt="SmartFood Narowal" />
          <h1>{mode === "forgot" ? "Forgot Password" : mode === "reset" ? "Reset Password" : "Admin Login"}</h1>
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          {message && <p style={{ color: "var(--success)" }}>{message}</p>}
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {mode === "forgot" ? (
            <>
              <button className="btn" type="button" onClick={requestReset}>Send reset code</button>
              <button className="btn outline" type="button" onClick={() => setMode("login")}>Back to login</button>
            </>
          ) : mode === "reset" ? (
            <>
              <input className="input" placeholder="Reset code" value={reset.token} onChange={(e) => setReset({ ...reset, token: e.target.value })} />
              <input className="input" type="password" placeholder="New password" value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} />
              <input className="input" type="password" placeholder="Confirm password" value={reset.confirmPassword} onChange={(e) => setReset({ ...reset, confirmPassword: e.target.value })} />
              <button className="btn">Reset Password</button>
              <button className="btn outline" type="button" onClick={() => setMode("forgot")}>Request a new code</button>
            </>
          ) : (
            <>
              <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button className="btn" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
              <button className="btn outline" type="button" onClick={() => setMode("forgot")}>Forgot Password</button>
              <p className="muted">No admin account? <Link to="/register">Register admin</Link></p>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
