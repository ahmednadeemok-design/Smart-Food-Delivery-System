import { useEffect, useState } from "react";
import DataTable from "../components/admin/DataTable.jsx";
import { getAdminPayments, refundAdminPayment } from "../services/adminService.js";
import { calculateRefundAmount } from "../features/refundEngine/refundRules.js";
import formatCurrency from "../utils/formatCurrency.js";
import { toast } from "../utils/toast.js";

export default function Refunds() {
  const [payments, setPayments] = useState([]);
  const [orderTotal, setOrderTotal] = useState(2000);
  const [decision, setDecision] = useState("partial_refund");

  const loadPayments = () => {
    getAdminPayments().then((res) => setPayments(res.data.data || [])).catch((err) => toast.error(err.message));
  };

  useEffect(() => loadPayments(), []);

  const decideRefund = async (payment, approved) => {
    const reason = window.prompt("Refund reason", approved ? "Complaint approved by admin" : "Refund rejected by admin");
    if (reason === null) return;
    try {
      await refundAdminPayment(payment._id, { approved, reason });
      toast.success(approved ? "Refund approved" : "Refund rejected");
      loadPayments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: "order", label: "Order", render: (row) => row.order?._id?.slice(-6) || "Order" },
    { key: "user", label: "User", render: (row) => row.user?.name || "User" },
    { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
    { key: "method", label: "Method" },
    { key: "restaurantRevenue", label: "Restaurant Net", render: (row) => formatCurrency(row.restaurantRevenue || 0) },
    { key: "riderEarning", label: "Rider", render: (row) => formatCurrency(row.riderEarning || 0) },
    { key: "platformCommission", label: "Commission", render: (row) => formatCurrency(row.platformCommission || 0) },
    { key: "status", label: "Status", render: (row) => <span className={`badge ${row.status === "refunded" ? "warning" : "success"}`}>{row.status}</span> },
    { key: "refundStatus", label: "Refund", render: (row) => <span className="badge">{row.refundStatus || "none"}</span> },
    { key: "refundReason", label: "Reason", render: (row) => row.refundReason || "-" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="action-row">
          <button className="btn success" onClick={() => decideRefund(row, true)}>Approve Refund</button>
          <button className="btn outline" onClick={() => decideRefund(row, false)}>Reject Refund</button>
        </div>
      ),
    },
  ];

  const amount = calculateRefundAmount(Number(orderTotal), decision);

  return (
    <section className="page">
      <div className="container">
        <h1>Refund Control</h1>
        <p className="muted">Approve/reject refunds, mark payments refunded, and record refund reason.</p>
        <div className="grid grid-2" style={{ marginBottom: 18 }}>
          <div className="card form">
            <label>Refund calculator order total</label>
            <input className="input" type="number" value={orderTotal} onChange={(e) => setOrderTotal(e.target.value)} />
            <label>Decision</label>
            <select value={decision} onChange={(e) => setDecision(e.target.value)}>
              <option value="none">No Refund</option>
              <option value="partial_refund">Partial Refund</option>
              <option value="full_refund">Full Refund</option>
            </select>
          </div>
          <div className="card">
            <span className="badge">Suggested Refund</span>
            <h1>{formatCurrency(amount)}</h1>
            <p className="muted">Use this as decision support, then apply the actual refund below.</p>
          </div>
        </div>
        <DataTable columns={columns} rows={payments} />
      </div>
    </section>
  );
}
