import { useEffect, useState } from "react";
import { createCampaign, deleteCampaign, getCampaigns, updateCampaign } from "../services/restaurantService.js";
import { toast } from "../utils/toast.js";

const initialForm = {
  title: "",
  description: "",
  discountType: "percent",
  discountValue: 10,
  appliesTo: "restaurant",
  startDate: "",
  endDate: "",
  isActive: true,
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(initialForm);

  const load = () =>
    getCampaigns()
      .then((res) => setCampaigns(res.data.data || []))
      .catch((err) => toast.error(err.message));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createCampaign({ ...form, discountValue: Number(form.discountValue || 0) });
      setForm(initialForm);
      toast.success("Campaign created");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggle = async (campaign) => {
    try {
      await updateCampaign(campaign._id, { isActive: !campaign.isActive });
      toast.success("Campaign updated");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (campaign) => {
    try {
      await deleteCampaign(campaign._id);
      toast.success("Campaign removed");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <h1>Campaigns</h1>
        <p className="muted">Create simple merchant offers that can be surfaced on customer restaurant cards.</p>

        <div className="grid grid-2">
          <form className="card form" onSubmit={submit}>
            <h3>Create Offer</h3>
            <input className="input" placeholder="Offer title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea rows="3" placeholder="Offer description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <option value="percent">Percent discount</option>
              <option value="fixed">Fixed PKR discount</option>
            </select>
            <input className="input" type="number" min="0" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
            <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}>
              <option value="restaurant">Whole restaurant</option>
              <option value="items">Selected menu items</option>
            </select>
            <div className="grid grid-2">
              <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <input className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <label>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              {" "}Campaign active
            </label>
            <button className="btn">Create campaign</button>
          </form>

          <div className="card">
            <h3>Active & Draft Offers</h3>
            {campaigns.length === 0 && <p className="muted">No campaigns yet.</p>}
            {campaigns.map((campaign) => (
              <div className="campaign-card" key={campaign._id}>
                <span className="badge">{campaign.isActive ? "Active" : "Paused"}</span>
                <h3>{campaign.title}</h3>
                <p className="muted">{campaign.description || "Restaurant offer"}</p>
                <p><b>{campaign.discountValue}{campaign.discountType === "percent" ? "%" : " PKR"}</b> off</p>
                <div className="action-row" style={{ display: "flex", gap: 8 }}>
                  <button className="btn outline" onClick={() => toggle(campaign)}>{campaign.isActive ? "Pause" : "Activate"}</button>
                  <button className="btn danger" onClick={() => remove(campaign)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
