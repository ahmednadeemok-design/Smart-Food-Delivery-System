import { useEffect, useState } from "react";
import DataTable from "../components/admin/DataTable.jsx";
import {
  deleteAdminRestaurant,
  getAdminRestaurantMenu,
  getAdminRestaurants,
  getRestaurantSupportTickets,
  updateAdminRestaurant,
  updateRestaurantSupportTicket,
} from "../services/adminService.js";
import { toast } from "../utils/toast.js";
import formatCurrency from "../utils/formatCurrency.js";

export default function ManageRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [menu, setMenu] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);

  const loadRestaurants = () => {
    getAdminRestaurants().then((res) => {
      if (res.data.data?.length) setRestaurants(res.data.data);
    }).catch((err) => toast.error(err.message));
    getRestaurantSupportTickets().then((res) => setSupportTickets(res.data.data || [])).catch(() => {});
  };

  useEffect(() => loadRestaurants(), []);

  const updateRestaurant = async (id, payload) => {
    try {
      await updateAdminRestaurant(id, payload);
      toast.success("Restaurant updated");
      loadRestaurants();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const editRestaurant = async (row) => {
    const name = window.prompt("Restaurant name", row.name);
    if (!name) return;
    const address = window.prompt("Address", row.address || "");
    await updateRestaurant(row._id, { name, address, reason: "Admin edited restaurant details" });
  };

  const removeRestaurant = async (id) => {
    if (!window.confirm("Delete this restaurant, menu, and cancel its orders?")) return;
    try {
      await deleteAdminRestaurant(id);
      toast.success("Restaurant deleted");
      loadRestaurants();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const viewMenu = async (row) => {
    try {
      const res = await getAdminRestaurantMenu(row._id);
      setMenu(res.data.data || []);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const resolveTicket = async (ticket) => {
    try {
      await updateRestaurantSupportTicket(ticket._id, { status: "resolved", adminNote: "Resolved by SmartFood operations" });
      toast.success("Support ticket resolved");
      loadRestaurants();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: "name", label: "Restaurant" },
    { key: "owner", label: "Owner", render: (row) => `${row.owner?.name || "Owner"} (${row.owner?.email || "no email"})` },
    { key: "ownerPhone", label: "Owner Phone", render: (row) => row.owner?.phone || "-" },
    { key: "isOpen", label: "Open", render: (row) => <span className={`badge ${row.isOpen === false ? "warning" : "success"}`}>{row.isOpen === false ? "Closed" : "Open"}</span> },
    { key: "approvalStatus", label: "Approval", render: (row) => <span className={`badge ${row.approvalStatus === "approved" ? "success" : row.approvalStatus === "rejected" ? "danger" : "warning"}`}>{row.approvalStatus || "pending"}</span> },
    { key: "isActive", label: "Active", render: (row) => <span className={`badge ${row.isActive === false ? "danger" : "success"}`}>{row.isActive === false ? "Inactive" : "Active"}</span> },
    { key: "kitchenLoad", label: "Kitchen Load", render: (row) => <span className="badge">{row.kitchenLoad}</span> },
    { key: "accuracyRate", label: "Accuracy Rate", render: (row) => `${row.accuracyRate || 100}%` },
    { key: "trustScore", label: "Trust Score", render: (row) => `${row.trustScore || 100}%` },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="action-row">
          <button className="btn success" onClick={() => updateRestaurant(row._id, { approvalStatus: "approved", isActive: true, reason: "Admin approved restaurant" })}>Approve</button>
          <button className="btn outline" onClick={() => updateRestaurant(row._id, { approvalStatus: "rejected", isActive: false, reason: "Admin rejected restaurant" })}>Reject</button>
          <button className="btn outline" onClick={() => updateRestaurant(row._id, { approvalStatus: "suspended", isActive: false, isOpen: false, reason: "Admin suspended restaurant" })}>Suspend</button>
          <button className="btn outline" onClick={() => updateRestaurant(row._id, { isActive: row.isActive === false, reason: "Admin toggled restaurant activation" })}>{row.isActive === false ? "Activate" : "Deactivate"}</button>
          <button className="btn outline" onClick={() => editRestaurant(row)}>Edit</button>
          <button className="btn outline" onClick={() => viewMenu(row)}>Menu</button>
          <button className="btn outline" onClick={() => updateRestaurant(row._id, { qualityFlag: !row.qualityFlag, qualityFlagReason: "Admin quality review", reason: "Admin toggled quality flag" })}>{row.qualityFlag ? "Unflag" : "Flag Quality"}</button>
          <button className="btn danger" onClick={() => removeRestaurant(row._id)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <section className="page">
      <div className="container">
        <h1>Manage Restaurants</h1>
        <p className="muted">Approve, reject, activate, edit, delete, inspect menus, and flag low-quality restaurants.</p>
        <DataTable columns={columns} rows={restaurants} />
        {menu.length > 0 && (
          <div className="card" style={{ marginTop: 18 }}>
            <h3>Selected Restaurant Menu</h3>
            <div className="grid grid-3">
              {menu.map((item) => (
                <div className="card" key={item._id}>
                  <span className={`badge ${item.isAvailable ? "success" : "warning"}`}>{item.isAvailable ? "Available" : "Hidden"}</span>
                  <h3>{item.name}</h3>
                  <p>{formatCurrency(item.price)} - {item.calories || 0} kcal</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="card" style={{ marginTop: 18 }}>
          <h3>Restaurant Support Tickets</h3>
          {supportTickets.length === 0 && <p className="muted">No restaurant support tickets yet.</p>}
          <div className="grid">
            {supportTickets.map((ticket) => (
              <div className="card" key={ticket._id}>
                <span className="badge">{ticket.status}</span>
                <h3>{ticket.restaurant?.name || "Restaurant"} - {ticket.type?.replace("_", " ")}</h3>
                <p>{ticket.description}</p>
                <p className="muted">{ticket.owner?.email || "Owner email unavailable"}</p>
                {ticket.status !== "resolved" && (
                  <button className="btn outline" onClick={() => resolveTicket(ticket)}>Mark resolved</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
