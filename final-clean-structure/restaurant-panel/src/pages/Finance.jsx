import { useEffect, useState } from "react";
import { Banknote, BarChart3, CreditCard, ReceiptText, RefreshCcw, ShieldCheck } from "lucide-react";
import StatCard from "../components/restaurant/StatCard.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import { createRestaurantPayoutRequest, getRestaurantFinance } from "../services/restaurantService.js";
import formatCurrency from "../utils/formatCurrency.js";
import socket from "../services/socket.js";
import { toast } from "../utils/toast.js";

export default function Finance() {
  const [finance, setFinance] = useState(null);
  const [amount, setAmount] = useState("");
  const [requesting, setRequesting] = useState(false);

  const load = async () => {
    const res = await getRestaurantFinance();
    setFinance(res.data.data || null);
  };

  useEffect(() => {
    load().catch((err) => toast.error(err.message));
    socket.on("restaurant:finance-updated", load);
    socket.on("order-status-updated", load);
    return () => {
      socket.off("restaurant:finance-updated", load);
      socket.off("order-status-updated", load);
    };
  }, []);

  const summary = finance?.summary || {};

  const requestSettlement = async (event) => {
    event.preventDefault();
    setRequesting(true);
    try {
      await createRestaurantPayoutRequest({ amount: Number(amount || summary.pendingSettlement), notes: "Restaurant settlement request" });
      toast.success("Settlement request submitted");
      setAmount("");
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <div className="card profile-hero restaurant-profile-hero">
          <div>
            <span className="badge">Restaurant finance</span>
            <h1>Sales, Settlements & Payouts</h1>
            <p className="muted">Net restaurant revenue, platform deductions, pending settlements, refunds, cancellations, and payout requests.</p>
          </div>
          <button className="btn outline" onClick={load}><RefreshCcw className="nav-icon" />Refresh</button>
        </div>

        <div className="grid grid-3 finance-grid">
          <StatCard title="Today Revenue" value={formatCurrency(summary.todayRevenue)} subtitle="Delivered net sales" icon={Banknote} />
          <StatCard title="Weekly Revenue" value={formatCurrency(summary.weeklyRevenue)} subtitle="Current operating week" icon={BarChart3} />
          <StatCard title="Monthly Revenue" value={formatCurrency(summary.monthlyRevenue)} subtitle="Current month" icon={ReceiptText} />
          <StatCard title="Pending Settlement" value={formatCurrency(summary.pendingSettlement)} subtitle={summary.payoutSchedule || "Manual payout approval"} icon={CreditCard} />
          <StatCard title="Completed Payouts" value={formatCurrency(summary.completedPayouts)} subtitle="Paid settlement requests" icon={ShieldCheck} />
          <StatCard title="Commission Deductions" value={formatCurrency(summary.commissionDeductions)} subtitle="Platform commission retained" icon={BarChart3} />
        </div>

        <div className="grid grid-2 finance-grid">
          <form className="card form finance-section" onSubmit={requestSettlement}>
            <h2>Request Settlement</h2>
            <p className="muted">Settlement requests are reviewed by SmartFood finance after COD reconciliation.</p>
            <input className="input" type="number" min="1" max={summary.pendingSettlement || 0} placeholder={formatCurrency(summary.pendingSettlement || 0)} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="btn" disabled={requesting || !summary.pendingSettlement}>{requesting ? "Submitting..." : "Request payout"}</button>
          </form>

          <div className="card finance-section">
            <h2>Operational Impact</h2>
            <div className="finance-row"><div><b>Refund impact</b><span>Approved refunds tied to delivered payments</span></div><strong>{formatCurrency(summary.refundImpact)}</strong></div>
            <div className="finance-row"><div><b>Cancellation impact</b><span>Cancelled or rejected order count</span></div><strong>{summary.cancellationImpact || 0}</strong></div>
          </div>
        </div>

        <div className="grid grid-2 finance-grid">
          <div className="card finance-section">
            <h2>Settlement Ledger</h2>
            <div className="finance-list">
              {(finance?.settlements || []).map((row) => (
                <div className="finance-row" key={row._id}>
                  <div><b>{row.order?._id ? `Order #${String(row.order._id).slice(-6)}` : "Settlement"}</b><span>Gross {formatCurrency(row.grossAmount)} · Commission {formatCurrency(row.commissionAmount)}</span></div>
                  <strong>{formatCurrency(row.netAmount)}</strong>
                  <StatusBadge value={row.status} />
                </div>
              ))}
              {(!finance?.settlements || finance.settlements.length === 0) && <div className="empty-state">No settlements posted yet.</div>}
            </div>
          </div>

          <div className="card finance-section">
            <h2>Payout Requests</h2>
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
          <h2>Transaction History</h2>
          <p className="muted">Order revenue, platform deductions, refund events, and payout ledger entries.</p>
          <div className="finance-list compact">
            {(finance?.transactions || []).map((row) => (
              <div className="finance-row" key={row._id}>
                <ReceiptText className="nav-icon" />
                <div><b>{row.type?.replace(/_/g, " ")}</b><span>{row.order?._id ? `Order #${String(row.order._id).slice(-6)} · ${row.order.status}` : row.note}</span></div>
                <strong>{formatCurrency(row.amount)}</strong>
                <StatusBadge value={row.status} />
              </div>
            ))}
            {(!finance?.transactions || finance.transactions.length === 0) && <div className="empty-state">No transaction activity yet.</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
