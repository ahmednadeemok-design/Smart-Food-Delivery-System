import { useEffect, useState } from "react";
import DataTable from "../components/admin/DataTable.jsx";
import { getRestaurants } from "../services/restaurantService.js";
import { mockRestaurants } from "../utils/mockData.js";

export default function ManageRestaurants() {
  const [restaurants, setRestaurants] = useState(mockRestaurants);

  useEffect(() => {
    getRestaurants().then((res) => {
      if (res.data.data?.length) setRestaurants(res.data.data);
    }).catch(() => {});
  }, []);

  const columns = [
    { key: "name", label: "Restaurant" },
    { key: "kitchenLoad", label: "Kitchen Load", render: (row) => <span className="badge">{row.kitchenLoad}</span> },
    { key: "accuracyRate", label: "Accuracy Rate", render: (row) => `${row.accuracyRate || 100}%` },
    { key: "trustScore", label: "Trust Score", render: (row) => `${row.trustScore || 100}%` },
  ];

  return (
    <section className="page">
      <div className="container">
        <h1>Manage Restaurants</h1>
        <p className="muted">Track restaurant trust, kitchen load, and order accuracy.</p>
        <DataTable columns={columns} rows={restaurants} />
      </div>
    </section>
  );
}
