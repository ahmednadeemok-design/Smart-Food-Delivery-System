import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email.trim());

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", vehicleType:"bike", cnic:"", bikeNumber:"", paymentAccountType:"JazzCash", paymentAccountNumber:"" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!isValidEmail(form.email)) return setError("Please enter a valid email address.");
    if (!form.phone.trim()) return setError("Phone number is required.");
    if (!form.password) return setError("Password is required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (!form.cnic.trim()) return setError("CNIC is required for rider onboarding.");
    if (!form.bikeNumber.trim()) return setError("Bike / vehicle number is required.");
    if (!form.paymentAccountNumber.trim()) return setError("Payment account number is required.");
    try { await register(form); navigate("/dashboard"); } catch (err) { setError(err.message); }
  };

  return <section className="page"><div className="container" style={{maxWidth:520}}><form className="card form" onSubmit={submit}><img className="auth-brand-logo" src="/brand/rider-icon.svg" alt="SmartFood Rider" /><h1>Rider Register</h1>{error && <p style={{color:"var(--danger)"}}>{error}</p>}<input className="input" placeholder="Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/><input className="input" type="email" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/><input className="input" placeholder="+923001234567" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/><input className="input" type="password" placeholder="Password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/><select value={form.vehicleType} onChange={(e)=>setForm({...form,vehicleType:e.target.value})}><option value="bike">Bike</option><option value="cycle">Cycle</option><option value="car">Car</option></select><input className="input" placeholder="CNIC" value={form.cnic} onChange={(e)=>setForm({...form,cnic:e.target.value})}/><input className="input" placeholder="Bike / vehicle number" value={form.bikeNumber} onChange={(e)=>setForm({...form,bikeNumber:e.target.value})}/><select value={form.paymentAccountType} onChange={(e)=>setForm({...form,paymentAccountType:e.target.value})}><option value="JazzCash">JazzCash</option><option value="EasyPaisa">EasyPaisa</option><option value="HBL Konnect">HBL Konnect</option></select><input className="input" placeholder="Payment account number" value={form.paymentAccountNumber} onChange={(e)=>setForm({...form,paymentAccountNumber:e.target.value})}/><button className="btn" disabled={loading}>{loading?"Creating...":"Register as Rider"}</button><p className="muted">Already registered? <Link to="/login">Login</Link></p></form></div></section>;
}
