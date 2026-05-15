import { useEffect, useState } from "react";
import TrustScoreCard from "../components/admin/TrustScoreCard.jsx";
import { adjustTrustScore, getAdminRestaurants, getAdminRiders, getAdminUsers, getTrustHistory } from "../services/adminService.js";
import { toast } from "../utils/toast.js";
import ActionModal from "../components/common/ActionModal.jsx";

export default function TrustScores() {
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [riders, setRiders] = useState([]);
  const [history, setHistory] = useState([]);
  const [trustChange, setTrustChange] = useState(null);
  const [changeValue, setChangeValue] = useState("-5");
  const [reason, setReason] = useState("Manual admin trust control");

  const load = async () => {
    try {
      const [usersRes, restaurantsRes, ridersRes, historyRes] = await Promise.all([
        getAdminUsers(),
        getAdminRestaurants(),
        getAdminRiders(),
        getTrustHistory(),
      ]);
      setUsers(usersRes.data.data || []);
      setRestaurants(restaurantsRes.data.data || []);
      setRiders(ridersRes.data.data || []);
      setHistory(historyRes.data.data || []);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changeScore = async () => {
    if (!trustChange) return;
    const change = Number(changeValue);
    if (!Number.isFinite(change)) return toast.error("Enter a valid trust score change number.");
    if (!reason.trim()) return toast.error("Reason is required.");
    try {
      await adjustTrustScore({ actorType: trustChange.type, actorId: trustChange.id, change, reason: reason.trim() });
      toast.success("Trust score updated");
      setTrustChange(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const combined = [
    ...users.filter((u) => u.role === "customer").map((u) => ({ id: u._id, name: u.name, type: "customer", score: u.trustScore || 100 })),
    ...riders.map((r) => ({ id: r._id, name: r.user?.name || "Rider", type: "rider", score: r.trustScore || 100 })),
    ...restaurants.map((r) => ({ id: r._id, name: r.name, type: "restaurant", score: r.trustScore || 100 })),
  ].filter((item) => ["customer", "rider", "restaurant"].includes(item.type));

  return (
    <section className="page">
      <div className="container">
        <h1>Trust Score Control</h1>
        <p className="muted">Increase/decrease customer, rider, and restaurant trust scores with reason history.</p>
        <div className="grid grid-3">
          {combined.map((item) => (
            <div className="card" key={`${item.type}-${item.id}`}>
              <TrustScoreCard name={item.name} type={item.type} score={item.score} />
              <button className="btn outline" onClick={() => { setTrustChange(item); setChangeValue("-5"); setReason("Manual admin trust control"); }}>Adjust Score</button>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 18 }}>
          <h3>Trust Score History</h3>
          {history.map((entry) => (
            <p key={entry._id}>
              <b>{entry.actorType}</b> {entry.actorId} changed by {entry.change} to {entry.score}. {entry.reason}
            </p>
          ))}
          {history.length === 0 && <p className="muted">No trust score changes yet.</p>}
        </div>
        {trustChange && (
          <ActionModal
            title="Adjust trust score"
            message={`Apply a trust score change for ${trustChange.name}. Use negative values for penalties.`}
            inputType="number"
            inputLabel="Score change"
            inputPlaceholder="-5"
            value={changeValue}
            onValueChange={setChangeValue}
            secondaryLabel="Reason"
            secondaryPlaceholder="Explain the operational reason"
            secondaryValue={reason}
            onSecondaryValueChange={setReason}
            confirmLabel="Apply Change"
            onCancel={() => setTrustChange(null)}
            onConfirm={changeScore}
          />
        )}
      </div>
    </section>
  );
}
