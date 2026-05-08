import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email.trim());

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "UET Narowal Campus, Hostel Gate, Narowal",
  });
  const [error, setError] = useState("");

  const update = (key, value) => setForm({ ...form, [key]: value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!isValidEmail(form.email)) return setError("Please enter a valid email address.");
    if (!form.phone.trim()) return setError("Phone number is required.");
    if (!form.password) return setError("Password is required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    try {
      await register(form);
      navigate("/restaurants");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card wide">
        <form className="card form" onSubmit={submit}>
          <span className="badge">Narowal only</span>
          <h2>Create Account</h2>
          <p className="muted">Register once, save addresses, earn loyalty points, and pay with COD.</p>
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => update("name", e.target.value)} />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <input className="input" placeholder="+923001234567" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)} />
          <select value={form.address} onChange={(e) => update("address", e.target.value)}>
            <option>UET Narowal Campus, Hostel Gate, Narowal</option>
            <option>Railway Road, near Narowal Railway Station</option>
            <option>Main Bazaar, Narowal</option>
            <option>Circular Road, near Narowal City Center</option>
            <option>Zafarwal Road, Narowal</option>
            <option>Shakargarh Road, Narowal</option>
            <option>New Lahore Road, Narowal</option>
            <option>DHQ Hospital Area, Narowal</option>
            <option>Narowal Railway Station, main entrance</option>
          </select>
          <button className="btn" disabled={loading}>{loading ? "Creating..." : "Register"}</button>
          <p className="muted">Already have account? <Link to="/login">Login</Link></p>
        </form>
      </div>
    </section>
  );
}
