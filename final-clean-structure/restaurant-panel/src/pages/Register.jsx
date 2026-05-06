import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container" style={{ maxWidth: 520 }}>
        <form className="card form" onSubmit={submit}>
          <h1>Restaurant Owner Register</h1>
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          <input className="input" placeholder="Owner Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="btn" disabled={loading}>{loading ? "Creating..." : "Register"}</button>
          <p className="muted">Already registered? <Link to="/login">Login</Link></p>
        </form>
      </div>
    </section>
  );
}
