import { useState } from "react";
import { createRiderProfile } from "../../services/riderService.js";
import { toast } from "../../utils/toast.js";

const NAROWAL_LOCATION = { lat: 32.1020, lng: 74.8740 };

export default function ProfileSetupCard({ onSaved }) {
  const [vehicleType, setVehicleType] = useState("bike");
  const [cnic, setCnic] = useState("");
  const [bikeNumber, setBikeNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^\d{5}-?\d{7}-?\d$/.test(cnic.trim())) return toast.error("Enter a valid CNIC number.");
    if (!bikeNumber.trim()) return toast.error("Bike or vehicle number is required.");
    setSaving(true);
    try {
      const res = await createRiderProfile({
        vehicleType,
        cnic,
        bikeNumber,
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
    <div className="card" style={{ marginBottom: 18 }}>
      <span className="badge">Profile required</span>
      <h2>Complete Rider Profile</h2>
      <p className="muted">Add your delivery vehicle before accepting Narowal orders.</p>
      <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 14 }}>
        <label>
          Vehicle type
          <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value)}>
            <option value="bike">Bike</option>
            <option value="cycle">Cycle</option>
            <option value="car">Car</option>
          </select>
        </label>
        <input className="input" placeholder="CNIC e.g. 35401-1234567-1" value={cnic} onChange={(event) => setCnic(event.target.value)} />
        <input className="input" placeholder="Bike / vehicle number" value={bikeNumber} onChange={(event) => setBikeNumber(event.target.value)} />
        <p className="muted">Phone verification and profile image upload are kept as operational placeholders for approval.</p>
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Rider Profile"}
        </button>
      </form>
    </div>
  );
}
