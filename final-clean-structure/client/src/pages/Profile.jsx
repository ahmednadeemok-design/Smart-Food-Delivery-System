import { useMemo, useState } from "react";
import { addSavedAddress, deleteSavedAddress, updateProfile } from "../services/userService.js";
import { useAuth } from "../store/AuthContext.jsx";
import { toast } from "../utils/toast.js";
import SmartMap from "../components/map/SmartMap.jsx";

const AREAS = [
  ["UET Narowal Campus", "UET Narowal Campus, Hostel Gate, Narowal", { lat: 32.1135, lng: 74.8734 }],
  ["Railway Road", "Railway Road, near Narowal Railway Station", { lat: 32.0990, lng: 74.8678 }],
  ["Main Bazaar", "Main Bazaar, Narowal", { lat: 32.1008, lng: 74.8712 }],
  ["Circular Road", "Circular Road, near Narowal City Center", { lat: 32.1020, lng: 74.8725 }],
  ["Zafarwal Road", "Zafarwal Road, Narowal", { lat: 32.0975, lng: 74.8842 }],
  ["Shakargarh Road", "Shakargarh Road, Narowal", { lat: 32.1071, lng: 74.8669 }],
  ["New Lahore Road", "New Lahore Road, Narowal", { lat: 32.0954, lng: 74.8788 }],
  ["DHQ Hospital Area", "DHQ Hospital Area, Narowal", { lat: 32.1058, lng: 74.8792 }],
  ["Narowal Railway Station", "Narowal Railway Station, main entrance", { lat: 32.0992, lng: 74.8669 }],
];

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    location: user?.location || { lat: 32.1020, lng: 74.8740 },
  });
  const [address, setAddress] = useState({
    label: "Home",
    address: "",
    location: { lat: 32.1020, lng: 74.8740 },
    isDefault: false,
  });

  const pointsToNext = useMemo(() => {
    const points = user?.loyalty?.points || 0;
    if (points >= 900) return 0;
    return points >= 350 ? 900 - points : 350 - points;
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profile);
      await refreshProfile();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    try {
      await addSavedAddress(address);
      await refreshProfile();
      setAddress({ label: "Home", address: "", location: { lat: 32.1020, lng: 74.8740 }, isDefault: false });
      toast.success("Address saved");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const choose = (value, setter, next) => {
    const picked = AREAS.find((area) => area[1] === value);
    setter({ ...next, address: value, location: picked?.[2] || next.location });
  };

  return (
    <section className="page">
      <div className="container grid grid-2">
        <form className="card form" onSubmit={saveProfile}>
          <span className="badge">{user?.loyalty?.badge || "Bronze"} member</span>
          <h1>Profile</h1>
          <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Full name" />
          <input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+923001234567" />
          <select value={profile.address} onChange={(e) => choose(e.target.value, setProfile, profile)}>
            <option value="">Choose Narowal area</option>
            {AREAS.map(([area, full]) => <option key={area} value={full}>{full}</option>)}
          </select>
          <textarea rows="3" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Complete Narowal delivery address" />
          <SmartMap points={[{ label: "Default address", ...(profile.location || { lat: 32.1020, lng: 74.8740 }) }]} onPick={(location) => setProfile({ ...profile, location })} />
          <button className="btn">Save Profile</button>
        </form>

        <div className="grid">
          <div className="card">
            <h2>Loyalty</h2>
            <p><b>{user?.loyalty?.points || 0}</b> points available</p>
            <p className="muted">{pointsToNext ? `${pointsToNext} points to next badge` : "Gold badge unlocked"}</p>
          </div>

          <form className="card form" onSubmit={saveAddress}>
            <h2>Saved Addresses</h2>
            <input className="input" value={address.label} onChange={(e) => setAddress({ ...address, label: e.target.value })} placeholder="Label" />
            <select value={address.address} onChange={(e) => choose(e.target.value, setAddress, address)}>
              <option value="">Choose Narowal area</option>
              {AREAS.map(([area, full]) => <option key={area} value={full}>{full}</option>)}
            </select>
            <label><input type="checkbox" checked={address.isDefault} onChange={(e) => setAddress({ ...address, isDefault: e.target.checked })} /> Set as default</label>
            <button className="btn outline">Add Address</button>
            {(user?.savedAddresses || []).map((item) => (
              <div className="mini-row" key={item._id}>
                <span><b>{item.label}</b><br />{item.address}</span>
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => deleteSavedAddress(item._id).then(refreshProfile).then(() => toast.success("Address removed")).catch((err) => toast.error(err.message))}
                >
                  Remove
                </button>
              </div>
            ))}
            {(user?.savedAddresses || []).length === 0 && <p className="muted">No saved addresses yet.</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
