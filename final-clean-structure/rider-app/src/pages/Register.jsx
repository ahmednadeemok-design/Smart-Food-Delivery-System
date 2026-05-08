import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email.trim());

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!isValidEmail(form.email)) return setError("Please enter a valid email address.");
    if (!form.phone.trim()) return setError("Phone number is required.");
    if (!form.password) return setError("Password is required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    try { await register(form); navigate("/dashboard"); } catch (err) { setError(err.message); }
  };

  return <section className="page"><div className="container" style={{maxWidth:520}}><form className="card form" onSubmit={submit}><h1>Rider Register</h1>{error && <p style={{color:"var(--danger)"}}>{error}</p>}<input className="input" placeholder="Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/><input className="input" type="email" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/><input className="input" placeholder="+923001234567" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/><input className="input" type="password" placeholder="Password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/><button className="btn" disabled={loading}>{loading?"Creating...":"Register as Rider"}</button><p className="muted">Already registered? <Link to="/login">Login</Link></p></form></div></section>;
}
