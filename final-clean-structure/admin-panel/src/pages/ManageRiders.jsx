import { useEffect, useState } from "react";
import DataTable from "../components/admin/DataTable.jsx";
import { getAdminRiders, updateAdminRider } from "../services/adminService.js";
import { toast } from "../utils/toast.js";
import StatusBadge from "../components/common/StatusBadge.jsx";
import socket from "../services/socket.js";

export default function ManageRiders() {
  const [riders, setRiders] = useState([]);

  const loadRiders = () => {
    getAdminRiders().then((res) => {
      if (res.data.data?.length) {
        setRiders(res.data.data.map((r) => ({
          _id: r._id,
          name: r.user?.name || "Rider",
          email: r.user?.email || "",
          phone: r.user?.phone || "",
          cnic: r.cnic || "",
          bikeNumber: r.bikeNumber || "",
          paymentAccountType: r.paymentAccountType || "",
          paymentAccountNumber: r.paymentAccountNumber || r.paymentAccount?.number || "",
          accountTitle: r.accountTitle || r.paymentAccount?.title || "",
          preferredArea: r.preferredArea || "",
          isOnline: r.isOnline,
          availabilityStatus: r.availabilityStatus || "pending_approval",
          approvalStatus: r.approvalStatus || "pending",
          isActive: r.isActive !== false,
          isSuspended: r.isSuspended,
          activeOrders: r.activeOrders?.length || 0,
          activeOrder: r.activeOrder?._id ? `#${String(r.activeOrder._id).slice(-6)} ${r.activeOrder.status}` : "-",
          earnings: r.totalLifetimeEarnings || r.earnings || 0,
          pendingPayout: r.pendingPayout || 0,
          currentLocation: r.currentLocation ? `${Number(r.currentLocation.lat || 0).toFixed(4)}, ${Number(r.currentLocation.lng || 0).toFixed(4)}` : "-",
          workloadScore: r.workloadScore || 0,
          trustScore: r.trustScore,
        })));
      }
    }).catch((err) => toast.error(err.message));
  };

  useEffect(() => {
    loadRiders();
    const reload = () => loadRiders();
    socket.emit("join-role-rooms");
    socket.on("admin:rider-updated", reload);
    socket.on("admin:rider-online-state", reload);
    socket.on("admin:rider-location-updated", reload);
    return () => {
      socket.off("admin:rider-updated", reload);
      socket.off("admin:rider-online-state", reload);
      socket.off("admin:rider-location-updated", reload);
    };
  }, []);

  const updateRider = async (id, payload) => {
    try {
      await updateAdminRider(id, payload);
      toast.success("Rider updated");
      loadRiders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: "name", label: "Rider", render: (row) => <div className="cell-main"><span className="cell-title">{row.name}</span><span className="cell-sub">{row.email}</span></div> },
    { key: "email", label: "Email", render: (row) => <span className="cell-sub">{row.email}</span> },
    { key: "phone", label: "Phone" },
    { key: "bikeNumber", label: "Vehicle" },
    { key: "preferredArea", label: "Area" },
    { key: "paymentAccountType", label: "Payout", render: (row) => `${row.paymentAccountType || "-"} ${row.accountTitle ? `(${row.accountTitle})` : ""}` },
    { key: "approvalStatus", label: "Approval", render: (row) => <StatusBadge value={row.approvalStatus} /> },
    { key: "availabilityStatus", label: "Status", render: (row) => <StatusBadge value={row.availabilityStatus} /> },
    { key: "activeOrders", label: "Active Orders" },
    { key: "activeOrder", label: "Active Job" },
    { key: "earnings", label: "Earnings", render: (row) => `Rs. ${Number(row.earnings || 0).toLocaleString("en-PK")}` },
    { key: "pendingPayout", label: "Pending Payout", render: (row) => `Rs. ${Number(row.pendingPayout || 0).toLocaleString("en-PK")}` },
    { key: "currentLocation", label: "Location" },
    { key: "workloadScore", label: "Workload" },
    { key: "trustScore", label: "Trust Score", render: (row) => `${row.trustScore}%` },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="action-row">
          <button className="btn success" onClick={() => updateRider(row._id, { approvalStatus: "approved", isActive: true, reason: "Admin approved rider" })}>Approve</button>
          <button className="btn outline" onClick={() => updateRider(row._id, { approvalStatus: "rejected", isActive: false, isOnline: false, reason: "Admin rejected rider" })}>Reject</button>
          <button className="btn outline" onClick={() => updateRider(row._id, { isActive: !row.isActive, isOnline: false, reason: "Admin toggled rider activation" })}>{row.isActive ? "Deactivate" : "Activate"}</button>
          <button className="btn outline" onClick={() => updateRider(row._id, { isSuspended: !row.isSuspended, suspensionReason: row.isSuspended ? "" : "Admin suspension", reason: "Admin toggled rider suspension" })}>{row.isSuspended ? "Unsuspend" : "Suspend"}</button>
          <button className="btn outline" onClick={() => updateRider(row._id, { trustScore: Number(window.prompt("New rider trust score", row.trustScore) || row.trustScore), reason: "Admin updated rider trust score" })}>Trust</button>
        </div>
      ),
    },
  ];

  return (
    <section className="page">
      <div className="container">
        <h1>Manage Riders</h1>
        <p className="muted">Approve, reject, suspend, activate, and control rider trust/workload.</p>
        <DataTable columns={columns} rows={riders} />
      </div>
    </section>
  );
}
