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
import StatusBadge from "../components/common/StatusBadge.jsx";
import socket from "../services/socket.js";

export default function ManageRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [menu, setMenu] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);

  const loadRestaurants = () => {
    getAdminRestaurants().then((res) => {
      setRestaurants(res.data.data || []);
    }).catch((err) => toast.error(err.message));
    getRestaurantSupportTickets().then((res) => setSupportTickets(res.data.data || [])).catch(() => {});
  };

  useEffect(() => {
    loadRestaurants();
    const reload = () => loadRestaurants();
    socket.emit("join-role-rooms");
    socket.on("admin:restaurant-updated", reload);
    socket.on("restaurant:state-updated", reload);
    socket.on("admin:support-ticket-updated", reload);
    return () => {
      socket.off("admin:restaurant-updated", reload);
      socket.off("restaurant:state-updated", reload);
      socket.off("admin:support-ticket-updated", reload);
    };
  }, []);

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
      if (!(res.data.data || []).length) toast.success("Menu is empty for this restaurant");
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
    { key: "name", label: "Restaurant", render: (row) => <div className="cell-main"><span className="cell-title">{row.name}</span><span className="cell-sub">{row.address || "Address unavailable"}</span></div> },
    { key: "owner", label: "Owner", render: (row) => <div className="cell-main"><span className="cell-title">{row.owner?.name || "Owner"}</span><span className="cell-sub">{row.owner?.email || "No email"}</span></div> },
    { key: "ownerPhone", label: "Owner Phone", render: (row) => row.owner?.phone || "-" },
    { key: "isOpen", label: "Open", render: (row) => <StatusBadge value={row.isOpen === false ? "Closed" : "Open"} /> },
    { key: "approvalStatus", label: "Approval", render: (row) => <StatusBadge value={row.approvalStatus || "pending"} /> },
    { key: "isActive", label: "Active", render: (row) => <StatusBadge value={row.isActive === false ? "Inactive" : "Active"} /> },
    { key: "kitchenLoad", label: "Kitchen Load", render: (row) => <StatusBadge value={row.kitchenLoad || "low"} /> },
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
                  <StatusBadge value={item.isAvailable ? "Available" : "Hidden"} />
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
                <StatusBadge value={ticket.status} />
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
