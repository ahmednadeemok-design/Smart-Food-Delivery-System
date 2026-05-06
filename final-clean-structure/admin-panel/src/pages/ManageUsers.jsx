import { useEffect, useState } from "react";
import DataTable from "../components/admin/DataTable.jsx";
import { getUsers } from "../services/userService.js";
import { mockUsers } from "../utils/mockData.js";

export default function ManageUsers() {
  const [users, setUsers] = useState(mockUsers);

  useEffect(() => {
    getUsers().then((res) => {
      if (res.data.data?.length) setUsers(res.data.data);
    }).catch(() => {});
  }, []);

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (row) => <span className="badge">{row.role}</span> },
    { key: "trustScore", label: "Trust Score", render: (row) => `${row.trustScore || 100}%` },
  ];

  return (
    <section className="page">
      <div className="container">
        <h1>Manage Users</h1>
        <p className="muted">View all system users and their role/trust score.</p>
        <DataTable columns={columns} rows={users} />
      </div>
    </section>
  );
}
