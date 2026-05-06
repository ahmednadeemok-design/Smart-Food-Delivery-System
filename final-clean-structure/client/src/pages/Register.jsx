import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "customer",
  });
  const [error, setError] = useState("");

  const update = (key, value) => setForm({ ...form, [key]: value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/restaurants");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container" style={{ maxWidth: 520 }}>
        <form className="card form" onSubmit={submit}>
          <h2>Create Account</h2>
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => update("name", e.target.value)} />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)} />
          <select value={form.role} onChange={(e) => update("role", e.target.value)}>
            <option value="customer">Customer</option>
            <option value="rider">Rider</option>
            <option value="restaurant">Restaurant</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn" disabled={loading}>{loading ? "Creating..." : "Register"}</button>
          <p className="muted">Already have account? <Link to="/login">Login</Link></p>
        </form>
      </div>
    </section>
  );
}
