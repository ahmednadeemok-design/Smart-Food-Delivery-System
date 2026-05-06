import { useState } from "react";
import { verifyDelivery } from "../services/orderService.js";
import { isValidOtp } from "../features/otpVerification/otpValidator.js";
import { toast } from "../utils/toast.js";

export default function DeliveryVerification() {
  const [form, setForm] = useState({ orderId:"", otp:"" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!isValidOtp(form.otp)) return toast.error("OTP must be 6 digits");
    setLoading(true);
    try { await verifyDelivery(form.orderId, form.otp); toast.success("Delivery verified successfully"); setForm({orderId:"",otp:""}); }
    catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return <section className="page"><div className="container" style={{maxWidth:620}}><form className="card form" onSubmit={submit}><span className="badge">Dispute Prevention</span><h1>Delivery OTP Verification</h1><p className="muted">Rider can complete delivery only after customer provides correct OTP.</p><input className="input" placeholder="Order ID" value={form.orderId} onChange={(e)=>setForm({...form,orderId:e.target.value})}/><input className="input" placeholder="6-digit OTP" value={form.otp} onChange={(e)=>setForm({...form,otp:e.target.value})}/><button className="btn" disabled={loading}>{loading?"Verifying...":"Verify Delivery"}</button></form></div></section>;
}
