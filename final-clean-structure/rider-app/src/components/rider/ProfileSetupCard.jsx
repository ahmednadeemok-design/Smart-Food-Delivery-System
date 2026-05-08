import { useState } from "react";
import { createRiderProfile } from "../../services/riderService.js";
import { toast } from "../../utils/toast.js";

const NAROWAL_LOCATION = { lat: 32.1020, lng: 74.8740 };
const AREAS = ["UET Narowal Campus", "Railway Road", "Main Bazaar", "Circular Road", "Zafarwal Road", "DHQ Hospital Area", "Narowal Railway Station"];

export default function ProfileSetupCard({ onSaved }) {
  const [form, setForm] = useState({
    vehicleType: "bike",
    cnic: "",
    bikeNumber: "",
    drivingLicence: "",
    emergencyContact: "",
    preferredArea: "UET Narowal Campus",
    paymentAccountType: "JazzCash",
    accountTitle: "",
    paymentAccountNumber: "",
    iban: "",
    ageConfirmed: false,
  });
  const [saving, setSaving] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.ageConfirmed) return toast.error("You must confirm rider is 18 or older.");
    if (!/^\d{5}-?\d{7}-?\d$/.test(form.cnic.trim())) return toast.error("Enter a valid CNIC number.");
    if (!form.bikeNumber.trim()) return toast.error("Bike or vehicle number is required.");
    if (!form.emergencyContact.trim()) return toast.error("Emergency contact is required.");
    if (!form.accountTitle.trim()) return toast.error("Account title is required.");
    if (!form.paymentAccountNumber.trim() && !form.iban.trim()) return toast.error("Payment account number or IBAN is required.");
    setSaving(true);
    try {
      const res = await createRiderProfile({
        ...form,
        vehicleNumber: form.bikeNumber,
        drivingLicense: form.drivingLicence,
        profileImage: "",
        currentLocation: NAROWAL_LOCATION,
        isOnline: false,
      });
      toast.success("Rider profile submitted. Admin approval is required before going online.");
      onSaved?.(res.data.data);
    } catch (err) {
      toast.error(err.message || "Unable to complete rider profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card onboarding-card" style={{ marginBottom: 18 }}>
      <span className="badge">Rider onboarding</span>
      <h2>Complete Delivery Partner Profile</h2>
      <p className="muted">Add identity, vehicle, emergency, payout, and Narowal operating details.</p>
      <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 14 }}>
        <label>Vehicle type<select value={form.vehicleType} onChange={(event) => update("vehicleType", event.target.value)}><option value="bike">Bike</option><option value="cycle">Cycle</option><option value="car">Car</option></select></label>
        <input className="input" placeholder="CNIC e.g. 35401-1234567-1" value={form.cnic} onChange={(event) => update("cnic", event.target.value)} />
        <input className="input" placeholder="Bike / vehicle number" value={form.bikeNumber} onChange={(event) => update("bikeNumber", event.target.value)} />
        <input className="input" placeholder="Driving licence placeholder" value={form.drivingLicence} onChange={(event) => update("drivingLicence", event.target.value)} />
        <input className="input" placeholder="Emergency contact +923001234567" value={form.emergencyContact} onChange={(event) => update("emergencyContact", event.target.value)} />
        <select value={form.preferredArea} onChange={(event) => update("preferredArea", event.target.value)}>{AREAS.map((area) => <option key={area} value={area}>{area}</option>)}</select>
        <select value={form.paymentAccountType} onChange={(event) => update("paymentAccountType", event.target.value)}><option value="JazzCash">JazzCash</option><option value="EasyPaisa">EasyPaisa</option><option value="NayaPay">NayaPay</option><option value="SadaPay">SadaPay</option><option value="Bank">Bank</option><option value="HBL Konnect">HBL Konnect</option></select>
        <input className="input" placeholder="Account title" value={form.accountTitle} onChange={(event) => update("accountTitle", event.target.value)} />
        <input className="input" placeholder="Account number" value={form.paymentAccountNumber} onChange={(event) => update("paymentAccountNumber", event.target.value)} />
        <input className="input" placeholder="IBAN placeholder for bank payout" value={form.iban} onChange={(event) => update("iban", event.target.value)} />
        <label className="check-row"><input type="checkbox" checked={form.ageConfirmed} onChange={(event) => update("ageConfirmed", event.target.checked)} /> I confirm I am 18 or older.</label>
        <p className="muted">Profile photo and phone verification are approval placeholders for local operations.</p>
        <button className="btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Submit for Approval"}</button>
      </form>
    </div>
  );
}
