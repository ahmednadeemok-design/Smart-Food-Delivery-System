import { useEffect, useMemo, useState } from "react";
import { Bike, BadgeCheck, CreditCard, FileCheck2, MapPin, ShieldCheck, UserRound } from "lucide-react";
import ProfileSetupCard from "../components/rider/ProfileSetupCard.jsx";
import StatCard from "../components/rider/StatCard.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import { getMyRiderProfile, getRiderEarnings, updateRiderAccount, updateRiderProfile } from "../services/riderService.js";
import { useAuth } from "../store/AuthContext.jsx";
import { toast } from "../utils/toast.js";

const areaOptions = ["UET Narowal Campus", "Railway Road", "Main Bazaar", "Circular Road", "Zafarwal Road", "DHQ Hospital Area", "Narowal Railway Station"];

const completionItems = (user, rider) => [
  { label: "Account name", done: Boolean(user?.name) },
  { label: "Phone number", done: Boolean(user?.phone) },
  { label: "CNIC", done: Boolean(rider?.cnic) },
  { label: "Emergency contact", done: Boolean(rider?.emergencyContact) },
  { label: "Vehicle plate", done: Boolean(rider?.vehicleNumber || rider?.bikeNumber) },
  { label: "Payout account", done: Boolean(rider?.paymentAccountNumber || rider?.paymentAccount?.number || rider?.iban) },
  { label: "Service zone", done: Boolean(rider?.preferredArea || rider?.serviceZones?.length) },
  { label: "Documents", done: Boolean(rider?.cnicFrontImage || rider?.drivingLicenseImage || rider?.vehicleRegistrationImage) },
];

export default function RiderProfile() {
  const { user, refreshProfile } = useAuth();
  const [payload, setPayload] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [accountForm, setAccountForm] = useState({ name: "", phone: "", avatar: "" });
  const [riderForm, setRiderForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    const [profileRes, earningsRes] = await Promise.all([getMyRiderProfile(), getRiderEarnings().catch(() => ({ data: { data: null } }))]);
    const data = profileRes.data.data || {};
    const rider = data.rider || null;
    setPayload(data);
    setEarnings(earningsRes.data.data || null);
    setAccountForm({ name: user?.name || rider?.user?.name || "", phone: user?.phone || rider?.user?.phone || "", avatar: user?.avatar || "" });
    setRiderForm({
      profileImage: rider?.profileImage || "",
      vehicleType: rider?.vehicleType || "bike",
      cnic: rider?.cnic || "",
      bikeNumber: rider?.bikeNumber || rider?.vehicleNumber || "",
      drivingLicence: rider?.drivingLicence || rider?.drivingLicense || "",
      emergencyContact: rider?.emergencyContact || "",
      preferredArea: rider?.preferredArea || areaOptions[0],
      serviceZones: (rider?.serviceZones || []).join(", "),
      paymentAccountType: rider?.paymentAccountType || rider?.paymentAccount?.type || "JazzCash",
      accountTitle: rider?.accountTitle || rider?.paymentAccount?.title || "",
      paymentAccountNumber: rider?.paymentAccountNumber || rider?.paymentAccount?.number || "",
      iban: rider?.iban || rider?.paymentAccount?.iban || "",
      cnicFrontImage: rider?.cnicFrontImage || "",
      cnicBackImage: rider?.cnicBackImage || "",
      drivingLicenseImage: rider?.drivingLicenseImage || "",
      vehicleRegistrationImage: rider?.vehicleRegistrationImage || "",
      ageConfirmed: rider?.ageConfirmed !== false,
      currentLocation: rider?.currentLocation || { lat: 32.1020, lng: 74.8740 },
    });
  };

  useEffect(() => {
    loadProfile().catch((err) => toast.error(err.message));
  }, []);

  const rider = payload?.rider;
  const checks = useMemo(() => completionItems(user, rider), [user, rider]);
  const completion = Math.round((checks.filter((item) => item.done).length / checks.length) * 100);

  const updateAccount = (key, value) => setAccountForm((prev) => ({ ...prev, [key]: value }));
  const updateRider = (key, value) => setRiderForm((prev) => ({ ...prev, [key]: value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!accountForm.name.trim()) return toast.error("Full name is required.");
    if (!accountForm.phone.trim()) return toast.error("Phone number is required.");
    if (!riderForm.cnic.trim()) return toast.error("CNIC is required.");
    if (!riderForm.bikeNumber.trim()) return toast.error("Vehicle plate number is required.");
    if (!riderForm.emergencyContact.trim()) return toast.error("Emergency contact is required.");
    setSaving(true);
    try {
      await updateRiderAccount(accountForm);
      const res = await updateRiderProfile({
        ...riderForm,
        vehicleNumber: riderForm.bikeNumber,
        drivingLicense: riderForm.drivingLicence,
        serviceZones: riderForm.serviceZones.split(",").map((zone) => zone.trim()).filter(Boolean),
        documentStatus: riderForm.cnicFrontImage || riderForm.drivingLicenseImage ? "submitted" : "missing",
        isOnline: rider?.isOnline || false,
      });
      await refreshProfile?.();
      setPayload((prev) => ({ ...(prev || {}), rider: res.data.data, needsProfile: false }));
      toast.success("Rider profile updated for operations review.");
      loadProfile().catch(() => {});
    } catch (err) {
      toast.error(err.message || "Unable to update rider profile.");
    } finally {
      setSaving(false);
    }
  };

  if (payload?.needsProfile) {
    return (
      <section className="page">
        <div className="container">
          <ProfileSetupCard onSaved={() => loadProfile()} />
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="container">
        <div className="card profile-hero">
          <div className="profile-avatar">{riderForm.profileImage ? <img src={riderForm.profileImage} alt="" /> : <UserRound />}</div>
          <div>
            <StatusBadge value={rider?.approvalStatus || "pending"} />
            <h1>{accountForm.name || "Rider profile"}</h1>
            <p className="muted">Identity, vehicle, payout, zones, verification documents, and live operational readiness.</p>
          </div>
          <div className="profile-completion">
            <b>{completion}%</b>
            <span>Complete</span>
          </div>
        </div>

        <div className="grid grid-3" style={{ marginTop: 18 }}>
          <StatCard title="Rating" value={`${payload?.rating || Math.round(((rider?.trustScore || 100) / 20) * 10) / 10}`} subtitle="Operational rider rating" />
          <StatCard title="Completed" value={earnings?.completedDeliveries || rider?.completedDeliveries || 0} subtitle="Lifetime deliveries" />
          <StatCard title="Trust Score" value={`${rider?.trustScore || 100}%`} subtitle={rider?.documentStatus || "documents missing"} />
          <StatCard title="Wallet" value={`Rs. ${Number(earnings?.walletBalance || rider?.walletBalance || 0).toLocaleString("en-PK")}`} subtitle="Current balance" />
          <StatCard title="Pending Payout" value={`Rs. ${Number(earnings?.pendingPayout || rider?.pendingPayout || 0).toLocaleString("en-PK")}`} subtitle={rider?.paymentAccountType || "No payout method"} />
          <StatCard title="Availability" value={rider?.isOnline ? "Online" : "Offline"} subtitle={rider?.availabilityStatus || "pending approval"} />
        </div>

        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <form className="card form profile-form" onSubmit={saveProfile}>
            <h2>Edit rider profile</h2>
            <div className="form-grid">
              <label>Full name<input className="input" value={accountForm.name} onChange={(e) => updateAccount("name", e.target.value)} /></label>
              <label>Phone<input className="input" value={accountForm.phone} onChange={(e) => updateAccount("phone", e.target.value)} /></label>
              <label>Profile photo URL<input className="input" value={riderForm.profileImage || ""} onChange={(e) => updateRider("profileImage", e.target.value)} /></label>
              <label>Vehicle type<select value={riderForm.vehicleType || "bike"} onChange={(e) => updateRider("vehicleType", e.target.value)}><option value="bike">Bike</option><option value="cycle">Cycle</option><option value="car">Car</option></select></label>
              <label>CNIC<input className="input" value={riderForm.cnic || ""} onChange={(e) => updateRider("cnic", e.target.value)} /></label>
              <label>Vehicle plate<input className="input" value={riderForm.bikeNumber || ""} onChange={(e) => updateRider("bikeNumber", e.target.value)} /></label>
              <label>Driving licence<input className="input" value={riderForm.drivingLicence || ""} onChange={(e) => updateRider("drivingLicence", e.target.value)} /></label>
              <label>Emergency contact<input className="input" value={riderForm.emergencyContact || ""} onChange={(e) => updateRider("emergencyContact", e.target.value)} /></label>
              <label>Primary zone<select value={riderForm.preferredArea || areaOptions[0]} onChange={(e) => updateRider("preferredArea", e.target.value)}>{areaOptions.map((area) => <option key={area}>{area}</option>)}</select></label>
              <label>Service zones<input className="input" value={riderForm.serviceZones || ""} onChange={(e) => updateRider("serviceZones", e.target.value)} /></label>
              <label>Payout method<select value={riderForm.paymentAccountType || "JazzCash"} onChange={(e) => updateRider("paymentAccountType", e.target.value)}><option>JazzCash</option><option>EasyPaisa</option><option>NayaPay</option><option>SadaPay</option><option>Bank</option><option>HBL Konnect</option></select></label>
              <label>Account title<input className="input" value={riderForm.accountTitle || ""} onChange={(e) => updateRider("accountTitle", e.target.value)} /></label>
              <label>Account number<input className="input" value={riderForm.paymentAccountNumber || ""} onChange={(e) => updateRider("paymentAccountNumber", e.target.value)} /></label>
              <label>IBAN<input className="input" value={riderForm.iban || ""} onChange={(e) => updateRider("iban", e.target.value)} /></label>
            </div>
            <h3>Document links</h3>
            <div className="form-grid">
              <label>CNIC front URL<input className="input" value={riderForm.cnicFrontImage || ""} onChange={(e) => updateRider("cnicFrontImage", e.target.value)} /></label>
              <label>CNIC back URL<input className="input" value={riderForm.cnicBackImage || ""} onChange={(e) => updateRider("cnicBackImage", e.target.value)} /></label>
              <label>Driving license URL<input className="input" value={riderForm.drivingLicenseImage || ""} onChange={(e) => updateRider("drivingLicenseImage", e.target.value)} /></label>
              <label>Vehicle registration URL<input className="input" value={riderForm.vehicleRegistrationImage || ""} onChange={(e) => updateRider("vehicleRegistrationImage", e.target.value)} /></label>
            </div>
            <button className="btn" disabled={saving} type="submit">{saving ? "Saving..." : "Save rider profile"}</button>
          </form>

          <div className="stack">
            <div className="card profile-checklist">
              <h2>Onboarding readiness</h2>
              {checks.map((item) => <div className="list-row" key={item.label}><span>{item.label}</span><StatusBadge value={item.done ? "complete" : "missing"} /></div>)}
            </div>
            <div className="card">
              <h2>Operational details</h2>
              <div className="profile-fact"><Bike /> <span>{rider?.vehicleType || "bike"} - {rider?.vehicleNumber || rider?.bikeNumber || "No plate"}</span></div>
              <div className="profile-fact"><MapPin /> <span>{rider?.preferredArea || "No primary zone"}</span></div>
              <div className="profile-fact"><CreditCard /> <span>{rider?.paymentAccountType || "No payout"} {rider?.accountTitle ? `- ${rider.accountTitle}` : ""}</span></div>
              <div className="profile-fact"><FileCheck2 /> <span>{rider?.documentStatus || "missing"} documents</span></div>
              <div className="profile-fact"><ShieldCheck /> <span>{rider?.phoneVerified ? "Phone verified" : "Phone verification pending"}</span></div>
              <div className="profile-fact"><BadgeCheck /> <span>{rider?.approvalStatus || "pending"} approval</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
