import { useEffect, useRef, useState } from "react";
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
import ContactActions from "../components/common/ContactActions.jsx";
import ActionModal from "../components/common/ActionModal.jsx";
import socket from "../services/socket.js";

export default function ManageRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [menu, setMenu] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queuedContactRefresh = useRef(false);

  const loadRestaurants = () => {
    getAdminRestaurants().then((res) => {
      setRestaurants(res.data.data || []);
    }).catch((err) => toast.error(err.message));
    getRestaurantSupportTickets().then((res) => setSupportTickets(res.data.data || [])).catch(() => {});
  };

  useEffect(() => {
    loadRestaurants();
    const reload = () => {
      if (window.__SMARTFOOD_CONTACT_MODAL_OPEN) {
        queuedContactRefresh.current = true;
        return;
      }
      loadRestaurants();
    };
    const flushQueuedRefresh = (event) => {
      if (!event.detail?.open && queuedContactRefresh.current) {
        queuedContactRefresh.current = false;
        loadRestaurants();
      }
    };
    socket.emit("join-role-rooms");
    socket.on("admin:restaurant-updated", reload);
    socket.on("restaurant:state-updated", reload);
    socket.on("admin:support-ticket-updated", reload);
    window.addEventListener("smartfood:contact-modal-state", flushQueuedRefresh);
    return () => {
      socket.off("admin:restaurant-updated", reload);
      socket.off("restaurant:state-updated", reload);
      socket.off("admin:support-ticket-updated", reload);
      window.removeEventListener("smartfood:contact-modal-state", flushQueuedRefresh);
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

  const editRestaurant = async () => {
    if (!editTarget) return;
    if (!editName.trim()) return toast.error("Restaurant name is required.");
    await updateRestaurant(editTarget._id, { name: editName.trim(), address: editAddress.trim(), reason: "Admin edited restaurant details" });
    setEditTarget(null);
  };

  const removeRestaurant = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminRestaurant(deleteTarget._id);
      toast.success("Restaurant deleted");
      setDeleteTarget(null);
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
    { key: "contact", label: "Contact", render: (row) => <ContactActions compact title={row.name} subtitle={row.owner?.name || "Owner"} phone={row.supportContact || row.phone || row.owner?.phone} location={row.location} address={row.address} /> },
    { key: "isOpen", label: "Open", render: (row) => <StatusBadge value={row.isOpen === false ? "Closed" : "Open"} /> },
    { key: "approvalStatus", label: "Approval", render: (row) => <StatusBadge value={row.approvalStatus || "pending"} /> },
    { key: "documentStatus", label: "Documents", render: (row) => <StatusBadge value={row.documentStatus || "missing"} /> },
    { key: "deliveryRadiusKm", label: "Radius", render: (row) => `${row.deliveryRadiusKm || 5} km` },
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
          <button className="btn outline" onClick={() => { setEditTarget(row); setEditName(row.name || ""); setEditAddress(row.address || ""); }}>Edit</button>
          <button className="btn outline" onClick={() => viewMenu(row)}>Menu</button>
          <button className="btn outline" onClick={() => updateRestaurant(row._id, { qualityFlag: !row.qualityFlag, qualityFlagReason: "Admin quality review", reason: "Admin toggled quality flag" })}>{row.qualityFlag ? "Unflag" : "Flag Quality"}</button>
          <button className="btn outline" onClick={() => updateRestaurant(row._id, { documentStatus: row.documentStatus === "verified" ? "submitted" : "verified", reason: "Admin reviewed restaurant documents" })}>{row.documentStatus === "verified" ? "Unverify Docs" : "Verify Docs"}</button>
          <button className="btn danger" onClick={() => setDeleteTarget(row)}>Delete</button>
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
                <ContactActions compact title={ticket.owner?.name || "Restaurant owner"} subtitle={ticket.restaurant?.name || "Restaurant"} phone={ticket.owner?.phone} />
                {ticket.status !== "resolved" && (
                  <button className="btn outline" onClick={() => resolveTicket(ticket)}>Mark resolved</button>
                )}
              </div>
            ))}
          </div>
        </div>
        {editTarget && (
          <ActionModal
            title="Edit restaurant"
            message="Update the core operational details shown to customers and admins."
            inputLabel="Restaurant name"
            inputPlaceholder="Restaurant name"
            value={editName}
            onValueChange={setEditName}
            secondaryLabel="Address"
            secondaryPlaceholder="Restaurant address"
            secondaryValue={editAddress}
            onSecondaryValueChange={setEditAddress}
            confirmLabel="Save Changes"
            onCancel={() => setEditTarget(null)}
            onConfirm={editRestaurant}
          />
        )}
        {deleteTarget && (
          <ActionModal
            title="Delete restaurant?"
            message={`This will delete ${deleteTarget.name}, its menu, and cancel related orders.`}
            danger
            confirmLabel="Delete Restaurant"
            onCancel={() => setDeleteTarget(null)}
            onConfirm={removeRestaurant}
          />
        )}
      </div>
    </section>
  );
}
