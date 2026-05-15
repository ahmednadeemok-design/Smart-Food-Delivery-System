import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Clock,
  CreditCard,
  FileCheck2,
  Gauge,
  Image,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Store,
  Utensils,
} from "lucide-react";
import StatusBadge from "../components/common/StatusBadge.jsx";
import StatCard from "../components/restaurant/StatCard.jsx";
import { getRestaurantDashboard, updateMyRestaurant, updateRestaurantAccount } from "../services/restaurantService.js";
import { useAuth } from "../store/AuthContext.jsx";
import { toast } from "../utils/toast.js";

const areas = ["UET Narowal Campus", "Railway Road", "Main Bazaar", "Circular Road", "Zafarwal Road", "DHQ Hospital Area", "Narowal Railway Station"];

const completionItems = (user, restaurant) => [
  { label: "Restaurant name", done: Boolean(restaurant?.name) },
  { label: "Owner contact", done: Boolean(user?.phone || restaurant?.ownerPhone) },
  { label: "Support phone", done: Boolean(restaurant?.supportContact || restaurant?.phone) },
  { label: "Address", done: Boolean(restaurant?.address && restaurant?.localArea) },
  { label: "Cuisine tags", done: Boolean(restaurant?.cuisineTypes?.length) },
  { label: "Business hours", done: Boolean(restaurant?.businessHours?.opensAt && restaurant?.businessHours?.closesAt) },
  { label: "Brand media", done: Boolean(restaurant?.logo || restaurant?.banner || restaurant?.image) },
  { label: "Business documents", done: Boolean(restaurant?.businessProof || restaurant?.licenseImage || restaurant?.cnicFrontImage) },
];

function Field({ label, children, className = "" }) {
  return <label className={`profile-field ${className}`.trim()}><span>{label}</span>{children}</label>;
}

function ProfileSection({ icon: Icon, title, description, children }) {
  return (
    <section className="profile-section">
      <div className="profile-section-head">
        <div className="profile-section-icon"><Icon /></div>
        <div>
          <h3>{title}</h3>
          <p className="muted">{description}</p>
        </div>
      </div>
      <div className="form-grid profile-section-grid">{children}</div>
    </section>
  );
}

export default function RestaurantProfile() {
  const { user, refreshProfile } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [accountForm, setAccountForm] = useState({ name: "", phone: "" });
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    const res = await getRestaurantDashboard();
    const data = res.data.data || {};
    const restaurant = data.restaurant || null;
    setDashboard(data);
    setAccountForm({ name: user?.name || restaurant?.owner?.name || "", phone: user?.phone || restaurant?.ownerPhone || "" });
    setForm({
      name: restaurant?.name || "",
      description: restaurant?.description || "",
      phone: restaurant?.phone || "",
      supportContact: restaurant?.supportContact || "",
      ownerPhone: restaurant?.ownerPhone || user?.phone || "",
      ownerEmail: restaurant?.ownerEmail || user?.email || "",
      address: restaurant?.address || "",
      localArea: restaurant?.localArea || areas[0],
      cuisineTypes: (restaurant?.cuisineTypes || []).join(", "),
      logo: restaurant?.logo || "",
      banner: restaurant?.banner || "",
      image: restaurant?.image || "",
      opensAt: restaurant?.businessHours?.opensAt || "11:00",
      closesAt: restaurant?.businessHours?.closesAt || "23:30",
      deliveryRadiusKm: restaurant?.deliveryRadiusKm || 5,
      averagePreparationTime: restaurant?.averagePreparationTime || 20,
      ownerCnic: restaurant?.ownerCnic || "",
      taxRegistration: restaurant?.taxRegistration || "",
      businessProof: restaurant?.businessProof || "",
      licenseImage: restaurant?.licenseImage || "",
      cnicFrontImage: restaurant?.cnicFrontImage || "",
      cnicBackImage: restaurant?.cnicBackImage || "",
      kitchenImage: restaurant?.kitchenImage || "",
      bankAccountType: restaurant?.bankAccountType || "JazzCash",
      payoutAccountTitle: restaurant?.payoutAccountTitle || "",
      bankAccountNumber: restaurant?.bankAccountNumber || "",
      deliveryPreference: restaurant?.deliveryPreference || "platform_riders",
      isOpen: restaurant?.isOpen !== false,
      kitchenLoad: restaurant?.kitchenLoad || "low",
      locationLat: restaurant?.location?.lat || 32.1020,
      locationLng: restaurant?.location?.lng || 74.8740,
    });
  };

  useEffect(() => {
    loadProfile().catch((err) => toast.error(err.message));
  }, []);

  const restaurant = dashboard?.restaurant;
  const checks = useMemo(() => completionItems(user, restaurant), [user, restaurant]);
  const completion = Math.round((checks.filter((item) => item.done).length / checks.length) * 100);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateAccount = (key, value) => setAccountForm((prev) => ({ ...prev, [key]: value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Restaurant name is required.");
    if (!form.phone.trim() && !form.supportContact.trim()) return toast.error("A restaurant or support phone is required.");
    if (!form.address.trim()) return toast.error("Business address is required.");
    setSaving(true);
    try {
      await updateRestaurantAccount(accountForm);
      await updateMyRestaurant({
        ...form,
        cuisineTypes: form.cuisineTypes.split(",").map((item) => item.trim()).filter(Boolean),
        businessHours: { opensAt: form.opensAt, closesAt: form.closesAt },
        location: { lat: Number(form.locationLat), lng: Number(form.locationLng) },
        documentStatus: form.businessProof || form.licenseImage || form.cnicFrontImage ? "submitted" : "missing",
      });
      await refreshProfile?.();
      toast.success("Restaurant profile updated for operations review.");
      loadProfile().catch(() => {});
    } catch (err) {
      toast.error(err.message || "Unable to update restaurant profile.");
    } finally {
      setSaving(false);
    }
  };

  if (dashboard?.onboardingRequired) {
    return (
      <section className="page">
        <div className="container">
          <div className="card">
            <StatusBadge value="onboarding required" />
            <h1>Create your restaurant profile</h1>
            <p className="muted">Use Menu onboarding to create the initial restaurant, then return here to complete operations readiness.</p>
            <a className="btn" href="/menu">Start restaurant onboarding</a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="container">
        <div className="card profile-hero restaurant-profile-hero">
          <div className="profile-avatar">{form.logo ? <img src={form.logo} alt="" /> : <Store />}</div>
          <div>
            <StatusBadge value={restaurant?.approvalStatus || "pending_review"} />
            <h1>{form.name || "Restaurant profile"}</h1>
            <p className="muted">Brand, owner, timings, kitchen readiness, delivery settings, verification, and settlement details.</p>
          </div>
          <div className="profile-completion"><b>{completion}%</b><span>Complete</span></div>
        </div>

        <div className="grid grid-3" style={{ marginTop: 18 }}>
          <StatCard title="Kitchen Status" value={restaurant?.isOpen === false ? "Closed" : "Open"} subtitle={restaurant?.kitchenLoad || "low"} />
          <StatCard title="Trust Score" value={`${restaurant?.trustScore || 100}%`} subtitle={restaurant?.documentStatus || "documents missing"} />
          <StatCard title="Rating" value={restaurant?.rating || "New"} subtitle={`${restaurant?.totalReviews || 0} reviews`} />
          <StatCard title="Prep Time" value={`${restaurant?.averagePreparationTime || 20} min`} subtitle="Average preparation" />
          <StatCard title="Accuracy" value={`${restaurant?.accuracyRate || 100}%`} subtitle="Order accuracy" />
          <StatCard title="Radius" value={`${restaurant?.deliveryRadiusKm || 5} km`} subtitle={restaurant?.deliveryPreference || "platform riders"} />
        </div>

        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <form className="card form profile-form restaurant-profile-form" onSubmit={saveProfile}>
            <div className="profile-form-title">
              <div>
                <h2>Edit restaurant profile</h2>
                <p className="muted">Structured operations record used for ordering, review, verification, and payouts.</p>
              </div>
              <StatusBadge value={restaurant?.documentStatus || "documents missing"} />
            </div>

            <ProfileSection icon={Store} title="Basic Information" description="Brand identity and primary owner contact details.">
              <Field label="Restaurant name"><input className="input" placeholder="e.g. Palmer Restaurant" value={form.name || ""} onChange={(e) => update("name", e.target.value)} /></Field>
              <Field label="Owner name"><input className="input" placeholder="Registered owner name" value={accountForm.name} onChange={(e) => updateAccount("name", e.target.value)} /></Field>
              <Field label="Restaurant phone"><input className="input" placeholder="+92 300 0000000" value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} /></Field>
              <Field label="Support phone"><input className="input" placeholder="Customer support number" value={form.supportContact || ""} onChange={(e) => update("supportContact", e.target.value)} /></Field>
              <Field label="Owner phone"><input className="input" placeholder="Owner account phone" value={accountForm.phone} onChange={(e) => updateAccount("phone", e.target.value)} /></Field>
              <Field label="Owner email"><input className="input" placeholder="owner@example.com" value={form.ownerEmail || ""} onChange={(e) => update("ownerEmail", e.target.value)} /></Field>
              <Field label="Logo URL"><input className="input" placeholder="https://.../logo.png" value={form.logo || ""} onChange={(e) => update("logo", e.target.value)} /></Field>
              <Field label="Banner URL"><input className="input" placeholder="https://.../banner.png" value={form.banner || ""} onChange={(e) => update("banner", e.target.value)} /></Field>
              <Field label="Menu image URL"><input className="input" placeholder="Optional storefront image" value={form.image || ""} onChange={(e) => update("image", e.target.value)} /></Field>
              <Field label="Description" className="span-2"><textarea rows="3" placeholder="Short public-facing restaurant description" value={form.description || ""} onChange={(e) => update("description", e.target.value)} /></Field>
            </ProfileSection>

            <ProfileSection icon={Gauge} title="Business Operations" description="Service coverage, opening window, preparation rhythm, and kitchen controls.">
              <Field label="Cuisine tags"><input className="input" placeholder="Desi, Fast Food, Pizza" value={form.cuisineTypes || ""} onChange={(e) => update("cuisineTypes", e.target.value)} /></Field>
              <Field label="Delivery preference"><select value={form.deliveryPreference || "platform_riders"} onChange={(e) => update("deliveryPreference", e.target.value)}><option value="platform_riders">Platform riders</option><option value="self_delivery">Self delivery</option><option value="hybrid">Hybrid</option></select></Field>
              <Field label="Opens at"><input className="input" type="time" value={form.opensAt || "11:00"} onChange={(e) => update("opensAt", e.target.value)} /></Field>
              <Field label="Closes at"><input className="input" type="time" value={form.closesAt || "23:30"} onChange={(e) => update("closesAt", e.target.value)} /></Field>
              <Field label="Delivery radius km"><input className="input" type="number" min="1" max="25" value={form.deliveryRadiusKm || 5} onChange={(e) => update("deliveryRadiusKm", e.target.value)} /></Field>
              <Field label="Prep time minutes"><input className="input" type="number" min="5" max="90" value={form.averagePreparationTime || 20} onChange={(e) => update("averagePreparationTime", e.target.value)} /></Field>
              <Field label="Kitchen load"><select value={form.kitchenLoad || "low"} onChange={(e) => update("kitchenLoad", e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
              <Field label="Live/open status"><select value={form.isOpen ? "open" : "closed"} onChange={(e) => update("isOpen", e.target.value === "open")}><option value="open">Open</option><option value="closed">Closed</option></select></Field>
            </ProfileSection>

            <ProfileSection icon={Navigation} title="Address & Location" description="Narowal coverage area, business address, and map coordinates.">
              <Field label="Local area"><select value={form.localArea || areas[0]} onChange={(e) => update("localArea", e.target.value)}>{areas.map((area) => <option key={area}>{area}</option>)}</select></Field>
              <Field label="Latitude"><input className="input" type="number" step="0.0001" placeholder="32.1020" value={form.locationLat || ""} onChange={(e) => update("locationLat", e.target.value)} /></Field>
              <Field label="Longitude"><input className="input" type="number" step="0.0001" placeholder="74.8740" value={form.locationLng || ""} onChange={(e) => update("locationLng", e.target.value)} /></Field>
              <Field label="Business address" className="span-2"><textarea rows="3" placeholder="Street, landmark, area, Narowal" value={form.address || ""} onChange={(e) => update("address", e.target.value)} /></Field>
            </ProfileSection>

            <ProfileSection icon={FileCheck2} title="Verification & Documents" description="Business identity, owner identity, and kitchen readiness evidence.">
              <Field label="Owner CNIC"><input className="input" placeholder="Owner CNIC" value={form.ownerCnic || ""} onChange={(e) => update("ownerCnic", e.target.value)} /></Field>
              <Field label="NTN / tax registration"><input className="input" placeholder="Business NTN or tax registration" value={form.taxRegistration || ""} onChange={(e) => update("taxRegistration", e.target.value)} /></Field>
              <Field label="Business proof URL"><input className="input" placeholder="Registration or ownership proof" value={form.businessProof || ""} onChange={(e) => update("businessProof", e.target.value)} /></Field>
              <Field label="License URL"><input className="input" placeholder="Food/license document link" value={form.licenseImage || ""} onChange={(e) => update("licenseImage", e.target.value)} /></Field>
              <Field label="CNIC front URL"><input className="input" placeholder="Front side document link" value={form.cnicFrontImage || ""} onChange={(e) => update("cnicFrontImage", e.target.value)} /></Field>
              <Field label="CNIC back URL"><input className="input" placeholder="Back side document link" value={form.cnicBackImage || ""} onChange={(e) => update("cnicBackImage", e.target.value)} /></Field>
              <Field label="Kitchen image URL"><input className="input" placeholder="Kitchen readiness photo" value={form.kitchenImage || ""} onChange={(e) => update("kitchenImage", e.target.value)} /></Field>
            </ProfileSection>

            <ProfileSection icon={CreditCard} title="Financial / Payout" description="Settlement method and account details for restaurant payouts.">
              <Field label="Payout method"><select value={form.bankAccountType || "JazzCash"} onChange={(e) => update("bankAccountType", e.target.value)}><option>JazzCash</option><option>EasyPaisa</option><option>HBL Konnect</option><option>Bank</option></select></Field>
              <Field label="Account title"><input className="input" placeholder="Registered account title" value={form.payoutAccountTitle || ""} onChange={(e) => update("payoutAccountTitle", e.target.value)} /></Field>
              <Field label="IBAN / account number"><input className="input" placeholder="IBAN or wallet account number" value={form.bankAccountNumber || ""} onChange={(e) => update("bankAccountNumber", e.target.value)} /></Field>
            </ProfileSection>

            <div className="profile-form-actions">
              <button className="btn" disabled={saving} type="submit">{saving ? "Saving..." : "Save restaurant profile"}</button>
            </div>
          </form>

          <div className="stack">
            <div className="card profile-checklist">
              <h2>Operational readiness</h2>
              {checks.map((item) => <div className="list-row" key={item.label}><span>{item.label}</span><StatusBadge value={item.done ? "complete" : "missing"} /></div>)}
            </div>
            <div className="card live-status-card">
              <div className="profile-side-head">
                <h2>Live operational status</h2>
                <StatusBadge value={restaurant?.isOpen === false ? "closed" : "open"} />
              </div>
              <div className="profile-fact"><Utensils /> <span>{restaurant?.cuisineTypes?.join(", ") || "No cuisine tags yet"}</span></div>
              <div className="profile-fact"><Clock /> <span>{restaurant?.businessHours?.opensAt || "11:00"} to {restaurant?.businessHours?.closesAt || "23:30"} · {restaurant?.averagePreparationTime || 20} min prep</span></div>
              <div className="profile-fact"><Gauge /> <span>{restaurant?.kitchenLoad || "low"} kitchen load · {restaurant?.deliveryRadiusKm || 5} km radius</span></div>
              <div className="profile-fact"><Phone /> <span>{restaurant?.supportContact || restaurant?.phone || "No support phone added"}</span></div>
              <div className="profile-fact"><MapPin /> <span>{restaurant?.address || "No business address added"}</span></div>
              <div className="profile-fact"><Image /> <span>{restaurant?.logo || restaurant?.banner || restaurant?.image ? "Brand media attached" : "Logo/banner not added"}</span></div>
              <div className="profile-fact"><FileCheck2 /> <span>{restaurant?.documentStatus || "missing"} documents</span></div>
              <div className="profile-fact"><ShieldCheck /> <span>{restaurant?.approvalStatus || "pending_review"} approval status</span></div>
              <div className="profile-fact"><BadgeCheck /> <span>{restaurant?.rating || "New"} rating · {restaurant?.trustScore || 100}% trust · {restaurant?.accuracyRate || 100}% accuracy</span></div>
              <div className="profile-fact"><CreditCard /> <span>{restaurant?.bankAccountType || "No payout method"} {restaurant?.payoutAccountTitle ? `· ${restaurant.payoutAccountTitle}` : ""}</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
