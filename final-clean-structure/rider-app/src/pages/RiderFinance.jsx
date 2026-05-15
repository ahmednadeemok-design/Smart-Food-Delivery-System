import { useEffect, useState } from "react";
import { Banknote, Clock3, Gift, PackageCheck, ShieldCheck, Star, WalletCards } from "lucide-react";
import StatCard from "../components/rider/StatCard.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import { createRiderPayoutRequest, getRiderFinance } from "../services/riderService.js";
import formatCurrency from "../utils/formatCurrency.js";
import socket from "../services/socket.js";
import { toast } from "../utils/toast.js";

export default function RiderFinance() {
  const [finance, setFinance] = useState(null);
  const [amount, setAmount] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async ({ notify = false } = {}) => {
    try {
      setError("");
      const res = await getRiderFinance();
      setFinance(res.data.data || null);
    } catch (err) {
      setError(err.message || "Unable to load rider finance.");
      if (notify) toast.error(err.message || "Unable to load rider finance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ notify: true });
    socket.on("rider:finance-updated", load);
    socket.on("order-status-updated", load);
    return () => {
      socket.off("rider:finance-updated", load);
      socket.off("order-status-updated", load);
    };
  }, []);

  const summary = finance?.summary || {};

  const requestPayout = async (event) => {
    event.preventDefault();
    setRequesting(true);
    try {
      await createRiderPayoutRequest({ amount: Number(amount || summary.pendingPayout), notes: "Rider wallet payout request" });
      toast.success("Payout request submitted");
      setAmount("");
      await load({ notify: false });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <div className="card rider-hero">
          <div>
            <span className="badge">Rider finance</span>
            <h1>Earnings & COD Wallet</h1>
            <p className="muted">Track delivery earnings, COD handled, pending payouts, incentives, and settlement history.</p>
          </div>
          <form className="payout-request" onSubmit={requestPayout}>
            <input className="input" type="number" min="1" max={summary.pendingPayout || 0} placeholder={formatCurrency(summary.pendingPayout || 0)} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="btn" disabled={requesting || !summary.pendingPayout}>{requesting ? "Requesting..." : "Request payout"}</button>
          </form>
        </div>

        {loading && <div className="card loading-card finance-grid">Loading rider finance...</div>}
        {!loading && error && (
          <div className="empty-state finance-grid">
            <h3>Finance is temporarily unavailable</h3>
            <p>{error}</p>
            <button className="btn" onClick={() => { setLoading(true); load({ notify: true }); }}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
        <div className="grid grid-3 finance-grid">
          <StatCard title="Today Earnings" value={formatCurrency(summary.todayEarnings)} subtitle="Posted delivered orders" icon={Banknote} />
          <StatCard title="Weekly Earnings" value={formatCurrency(summary.weeklyEarnings)} subtitle="Current operating week" icon={Clock3} />
          <StatCard title="Monthly Earnings" value={formatCurrency(summary.monthlyEarnings)} subtitle="Current month" icon={WalletCards} />
          <StatCard title="COD Collected" value={formatCurrency(summary.codCollected)} subtitle="Cash handled on deliveries" icon={Banknote} />
          <StatCard title="Pending Payout" value={formatCurrency(summary.pendingPayout)} subtitle="Available for payout request" icon={WalletCards} />
          <StatCard title="Completed Deliveries" value={summary.completedDeliveries || 0} subtitle={`${summary.trustScore || 100}% trust score`} icon={PackageCheck} />
          <StatCard title="Wallet Balance" value={formatCurrency(summary.walletBalance)} subtitle="Rider payable balance" icon={WalletCards} />
          <StatCard title="Incentives" value={formatCurrency((summary.incentives || 0) + (summary.bonuses || 0))} subtitle="Bonuses and campaigns" icon={Gift} />
          <StatCard title="Trust Indicator" value={`${summary.trustScore || 100}%`} subtitle={`${formatCurrency(summary.cancellationPenalties || 0)} penalties`} icon={Star} />
        </div>

        <div className="grid grid-2 finance-grid">
          <div className="card finance-section">
            <h2>Settlement History</h2>
            <p className="muted">Ledger entries are created only after delivery is verified.</p>
            <div className="finance-list">
              {(finance?.transactions || []).map((row) => (
                <div className="finance-row" key={row._id}>
                  <div><b>{row.type?.replace(/_/g, " ")}</b><span>{row.restaurant?.name || row.note || "SmartFood"}</span></div>
                  <strong>{formatCurrency(row.amount)}</strong>
                  <StatusBadge value={row.status} />
                </div>
              ))}
              {(!finance?.transactions || finance.transactions.length === 0) && <div className="empty-state">No finance activity yet.</div>}
            </div>
          </div>

          <div className="card finance-section">
            <h2>Payout Requests</h2>
            <p className="muted">Admin-approved payouts show masked account details only.</p>
            <div className="finance-list">
              {(finance?.payouts || []).map((row) => (
                <div className="finance-row" key={row._id}>
                  <div><b>{formatCurrency(row.amount)}</b><span>{row.payoutMethod || "Payout method"} · ****{row.accountLast4 || row.ibanLast4 || "----"}</span></div>
                  <StatusBadge value={row.status} />
                </div>
              ))}
              {(!finance?.payouts || finance.payouts.length === 0) && <div className="empty-state">No payout requests yet.</div>}
            </div>
          </div>
        </div>

        <div className="card finance-section">
          <h2>COD Collections</h2>
          <p className="muted">Operational cash reconciliation for delivered COD orders.</p>
          <div className="finance-list compact">
            {(finance?.codCollections || []).map((row) => (
              <div className="finance-row" key={row._id}>
                <ShieldCheck className="nav-icon" />
                <div><b>{row.restaurant?.name || "Restaurant"}</b><span>{row.order?._id ? `Order #${String(row.order._id).slice(-6)}` : "COD order"}</span></div>
                <strong>{formatCurrency(row.amount)}</strong>
                <StatusBadge value={row.status} />
              </div>
            ))}
            {(!finance?.codCollections || finance.codCollections.length === 0) && <div className="empty-state">No COD collections recorded yet.</div>}
          </div>
        </div>
          </>
        )}
      </div>
    </section>
  );
}
