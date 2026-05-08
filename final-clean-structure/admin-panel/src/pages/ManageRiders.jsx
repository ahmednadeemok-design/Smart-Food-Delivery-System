import { useEffect, useState } from "react";
import DataTable from "../components/admin/DataTable.jsx";
import { getAdminRiders, updateAdminRider } from "../services/adminService.js";
import { toast } from "../utils/toast.js";

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
          isOnline: r.isOnline,
          availabilityStatus: r.availabilityStatus || "pending_approval",
          approvalStatus: r.approvalStatus || "pending",
          isActive: r.isActive !== false,
          isSuspended: r.isSuspended,
          activeOrders: r.activeOrders?.length || 0,
          workloadScore: r.workloadScore || 0,
          trustScore: r.trustScore,
        })));
      }
    }).catch((err) => toast.error(err.message));
  };

  useEffect(() => loadRiders(), []);

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
    { key: "name", label: "Rider" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "bikeNumber", label: "Vehicle" },
    { key: "approvalStatus", label: "Approval", render: (row) => <span className={`badge ${row.approvalStatus === "approved" ? "success" : row.approvalStatus === "rejected" ? "danger" : "warning"}`}>{row.approvalStatus}</span> },
    { key: "availabilityStatus", label: "Status", render: (row) => <span className={`badge ${row.isOnline ? "success" : "warning"}`}>{row.availabilityStatus}</span> },
    { key: "activeOrders", label: "Active Orders" },
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
