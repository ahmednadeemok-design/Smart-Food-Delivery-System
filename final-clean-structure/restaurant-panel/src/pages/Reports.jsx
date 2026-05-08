import { useEffect, useState } from "react";
import StatCard from "../components/restaurant/StatCard.jsx";
import { getRestaurantReports } from "../services/restaurantService.js";
import { toast } from "../utils/toast.js";
import formatCurrency from "../utils/formatCurrency.js";

export default function Reports() {
  const [reports, setReports] = useState(null);

  useEffect(() => {
    getRestaurantReports()
      .then((res) => setReports(res.data.data || null))
      .catch((err) => toast.error(err.message));
  }, []);

  const metrics = reports?.metrics || {};

  return (
    <section className="page">
      <div className="container">
        <h1>Sales & Operations</h1>
        <p className="muted">Real sales, settlement, kitchen, and partner performance data from MongoDB.</p>

        <div className="grid grid-3">
          <StatCard title="Today Revenue" value={formatCurrency(metrics.todaySales || 0)} subtitle="Delivered order revenue" />
          <StatCard title="Weekly Revenue" value={formatCurrency(metrics.weeklySales || 0)} subtitle="Last 7 days" />
          <StatCard title="Monthly Revenue" value={formatCurrency(metrics.monthlyRevenue || 0)} subtitle="Current month" />
          <StatCard title="Completed Orders" value={metrics.completedOrders || 0} subtitle={`${metrics.rejectedOrders || 0} rejected`} />
          <StatCard title="Average Order" value={formatCurrency(metrics.averageOrderValue || 0)} subtitle="Gross order value" />
          <StatCard title="Accuracy Rate" value={`${metrics.accuracyRate || 100}%`} subtitle="Accepted/prepared successfully" />
        </div>

        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <div className="card">
            <h3>Popular Items</h3>
            {(metrics.popularItems || []).length === 0 && <p className="muted">No sales data yet.</p>}
            {(metrics.popularItems || []).map((item) => (
              <div className="list-row" key={item._id}>
                <span>{item.name}</span>
                <b>{item.soldCount || 0} sold</b>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>Peak Order Hours</h3>
            {(metrics.peakOrderHours || []).length === 0 && <p className="muted">Peak hours will appear after delivered orders.</p>}
            {(metrics.peakOrderHours || []).map((slot) => (
              <div className="list-row" key={slot.hour}>
                <span>{slot.hour}</span>
                <b>{slot.count} orders</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
