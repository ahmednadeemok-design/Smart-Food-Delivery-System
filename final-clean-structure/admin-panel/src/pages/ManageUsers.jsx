import { useEffect, useState } from "react";
import DataTable from "../components/admin/DataTable.jsx";
import { deleteAdminUser, getAdminUsers, issuePasswordReset, updateAdminUser } from "../services/adminService.js";
import { toast } from "../utils/toast.js";
import StatusBadge from "../components/common/StatusBadge.jsx";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);

  const loadUsers = () => {
    getAdminUsers().then((res) => {
      setUsers(res.data.data || []);
    }).catch((err) => toast.error(err.message));
  };

  useEffect(() => loadUsers(), []);

  const updateUser = async (id, payload) => {
    try {
      await updateAdminUser(id, payload);
      toast.success("User updated");
      loadUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeUser = async (id) => {
    if (!window.confirm("Delete this user and related profile data?")) return;
    try {
      await deleteAdminUser(id);
      toast.success("User deleted");
      loadUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const resetPassword = async (row) => {
    try {
      const res = await issuePasswordReset(row._id, { reason: "Admin issued temporary password" });
      toast.success(`Temporary password for ${row.email}: ${res.data.data.temporaryPassword}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: "name", label: "Name", render: (row) => <div className="cell-main"><span className="cell-title">{row.name}</span><span className="cell-sub">{row.phone || "No phone"}</span></div> },
    { key: "email", label: "Email", render: (row) => <span className="cell-sub">{row.email}</span> },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <select value={row.role} onChange={(e) => updateUser(row._id, { role: e.target.value, reason: "Admin changed user role" })}>
          {["customer", "rider", "restaurant", "admin"].map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
      ),
    },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.isBlocked ? "Blocked" : "Active"} /> },
    { key: "trustScore", label: "Trust Score", render: (row) => `${row.trustScore || 100}%` },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="action-row">
          <button className="btn outline" onClick={() => updateUser(row._id, { isBlocked: !row.isBlocked, blockReason: row.isBlocked ? "" : "Admin block", reason: "Admin toggled user block" })}>
            {row.isBlocked ? "Unblock" : "Block"}
          </button>
          <button className="btn outline" onClick={() => resetPassword(row)}>Reset Password</button>
          <button className="btn danger" onClick={() => removeUser(row._id)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <section className="page">
      <div className="container">
        <h1>Manage Users</h1>
        <p className="muted">View, block, unblock, delete, change roles, and review trust scores.</p>
        <DataTable columns={columns} rows={users} />
      </div>
    </section>
  );
}
