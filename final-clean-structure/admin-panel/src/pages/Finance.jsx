import { useEffect, useMemo, useState } from "react";
import { Banknote, CheckCircle2, CircleDollarSign, Landmark, RefreshCcw, ShieldAlert, WalletCards } from "lucide-react";
import StatCard from "../components/admin/StatCard.jsx";
import DataTable from "../components/admin/DataTable.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import {
  getCODCollections,
  getFinanceDashboard,
  getFinanceTransactions,
  getPayoutRequests,
  reconcileCODCollection,
  updatePayoutRequest,
} from "../services/adminService.js";
import formatCurrency from "../utils/formatCurrency.js";
import socket from "../services/socket.js";
import { toast } from "../utils/toast.js";

const actorName = (row) => row.restaurant?.name || row.rider?.user?.name || row.actorType || "Platform";

export default function Finance() {
  const [dashboard, setDashboard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [cod, setCod] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const [dashboardRes, txRes, payoutRes, codRes] = await Promise.all([
      getFinanceDashboard(),
      getFinanceTransactions(filter === "all" ? {} : { type: filter }),
      getPayoutRequests(),
      getCODCollections(),
    ]);
    setDashboard(dashboardRes.data.data || null);
    setTransactions(txRes.data.data || []);
    setPayouts(payoutRes.data.data || []);
    setCod(codRes.data.data || []);
  };

  useEffect(() => {
    load().catch((err) => toast.error(err.message));
    socket.on("admin:payout-requested", load);
    socket.on("admin:payout-updated", load);
    socket.on("admin:cod-reconciled", load);
    socket.on("order-status-updated", load);
    return () => {
      socket.off("admin:payout-requested", load);
      socket.off("admin:payout-updated", load);
      socket.off("admin:cod-reconciled", load);
      socket.off("order-status-updated", load);
    };
  }, [filter]);

  const totals = dashboard?.totals || {};
  const pendingPayouts = useMemo(() => payouts.filter((item) => ["pending", "processing"].includes(item.status)), [payouts]);

  const actOnPayout = async (id, status) => {
    try {
      await updatePayoutRequest(id, { status, notes: `Finance marked payout ${status}` });
      toast.success(`Payout ${status}`);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const reconcile = async (id) => {
    try {
      await reconcileCODCollection(id, { note: "COD matched against delivery ledger" });
      toast.success("COD reconciled");
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const payoutColumns = [
    { key: "requester", label: "Requester", render: (row) => <div className="cell-main"><span className="cell-title">{row.restaurant?.name || row.rider?.user?.name || "Account"}</span><span className="cell-sub">{row.requesterType} · {row.payoutMethod || "method missing"} · ****{row.accountLast4 || row.ibanLast4 || "----"}</span></div> },
    { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "createdAt", label: "Requested", render: (row) => new Date(row.createdAt).toLocaleString() },
    { key: "actions", label: "Actions", render: (row) => (
      <div className="action-row">
        {row.status === "pending" && <button className="btn outline" onClick={() => actOnPayout(row._id, "processing")}>Process</button>}
        {["pending", "processing"].includes(row.status) && <button className="btn success" onClick={() => actOnPayout(row._id, "completed")}>Complete</button>}
        {["pending", "processing"].includes(row.status) && <button className="btn outline" onClick={() => actOnPayout(row._id, "failed")}>Fail</button>}
        {row.status === "pending" && <button className="btn danger" onClick={() => actOnPayout(row._id, "rejected")}>Reject</button>}
      </div>
    ) },
  ];

  const transactionColumns = [
    { key: "type", label: "Ledger Event", render: (row) => <div className="cell-main"><span className="cell-title">{row.type?.replace(/_/g, " ")}</span><span className="cell-sub">{actorName(row)}</span></div> },
    { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "order", label: "Order", render: (row) => row.order?._id ? `#${String(row.order._id).slice(-6)} · ${row.order.status}` : "-" },
    { key: "createdAt", label: "Posted", render: (row) => new Date(row.createdAt).toLocaleString() },
  ];

  const codColumns = [
    { key: "rider", label: "Rider", render: (row) => row.rider?.user?.name || "Unassigned" },
    { key: "restaurant", label: "Restaurant", render: (row) => row.restaurant?.name || "Restaurant" },
    { key: "amount", label: "COD", render: (row) => formatCurrency(row.amount) },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "actions", label: "Actions", render: (row) => row.status !== "reconciled" ? <button className="btn outline" onClick={() => reconcile(row._id)}>Reconcile</button> : <StatusBadge value="complete" /> },
  ];

  return (
    <section className="page">
      <div className="container">
        <div className="card finance-hero">
          <div>
            <span className="badge">Operational finance control</span>
            <h1>Finance Command Center</h1>
            <p className="muted">Platform earnings, COD exposure, partner liabilities, payout approvals, and finance ledger integrity.</p>
          </div>
          <button className="btn outline" onClick={load}><RefreshCcw className="nav-icon" />Refresh</button>
        </div>

        <div className="grid grid-3 finance-grid">
          <StatCard title="Platform Earnings" value={formatCurrency(totals.platformEarnings)} subtitle="Commission, service, and fee revenue" icon={CircleDollarSign} />
          <StatCard title="COD In Circulation" value={formatCurrency(totals.codInCirculation)} subtitle="Cash collected but not reconciled" icon={Banknote} />
          <StatCard title="Pending Liabilities" value={formatCurrency(totals.pendingLiabilities)} subtitle="Rider plus restaurant payable balance" icon={ShieldAlert} />
          <StatCard title="Restaurant Liability" value={formatCurrency(totals.restaurantLiabilities)} subtitle="Pending partner settlements" icon={Landmark} />
          <StatCard title="Rider Liability" value={formatCurrency(totals.riderLiabilities)} subtitle="Pending rider payouts" icon={WalletCards} />
          <StatCard title="Refund Liability" value={formatCurrency(totals.refundLiabilities)} subtitle="Approved refund exposure" icon={CheckCircle2} />
        </div>

        <section className="finance-section">
          <div className="finance-section-head">
            <div>
              <h2>Payout Queue</h2>
              <p className="muted">{pendingPayouts.length} pending or processing payout requests.</p>
            </div>
          </div>
          <DataTable columns={payoutColumns} rows={payouts} />
        </section>

        <section className="finance-section">
          <div className="finance-section-head">
            <div>
              <h2>Finance Ledger</h2>
              <p className="muted">Idempotent order, COD, settlement, refund, and payout events.</p>
            </div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All ledger types</option>
              <option value="cod_collected">COD collected</option>
              <option value="restaurant_settlement">Restaurant settlement</option>
              <option value="rider_earning">Rider earning</option>
              <option value="platform_earning">Platform earning</option>
              <option value="refund_liability">Refund liability</option>
            </select>
          </div>
          <DataTable columns={transactionColumns} rows={transactions} />
        </section>

        <section className="finance-section">
          <h2>COD Reconciliation</h2>
          <p className="muted">Match delivered COD orders against rider cash handover.</p>
          <DataTable columns={codColumns} rows={cod} />
        </section>
      </div>
    </section>
  );
}
