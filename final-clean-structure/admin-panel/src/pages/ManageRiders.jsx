import { useEffect, useState } from "react";
import DataTable from "../components/admin/DataTable.jsx";
import { getRiders } from "../services/riderService.js";
import { mockRiders } from "../utils/mockData.js";

export default function ManageRiders() {
  const [riders, setRiders] = useState(mockRiders);

  useEffect(() => {
    getRiders().then((res) => {
      if (res.data.data?.length) {
        setRiders(res.data.data.map((r) => ({
          _id: r._id,
          name: r.user?.name || "Rider",
          isOnline: r.isOnline,
          activeOrders: r.activeOrders?.length || 0,
          trustScore: r.trustScore,
        })));
      }
    }).catch(() => {});
  }, []);

  const columns = [
    { key: "name", label: "Rider" },
    { key: "isOnline", label: "Status", render: (row) => <span className={`badge ${row.isOnline ? "success" : "warning"}`}>{row.isOnline ? "Online" : "Offline"}</span> },
    { key: "activeOrders", label: "Active Orders" },
    { key: "trustScore", label: "Trust Score", render: (row) => `${row.trustScore}%` },
  ];

  return (
    <section className="page">
      <div className="container">
        <h1>Manage Riders</h1>
        <p className="muted">Monitor rider workload, online status, and trust score.</p>
        <DataTable columns={columns} rows={riders} />
      </div>
    </section>
  );
}
