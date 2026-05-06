import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form);
      navigate("/restaurants");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container" style={{ maxWidth: 460 }}>
        <form className="card form" onSubmit={submit}>
          <h2>Login</h2>
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="btn" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
          <p className="muted">No account? <Link to="/register">Register here</Link></p>
        </form>
      </div>
    </section>
  );
}
