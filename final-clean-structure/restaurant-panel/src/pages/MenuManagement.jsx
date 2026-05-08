import { useEffect, useState } from "react";
import MenuForm from "../components/restaurant/MenuForm.jsx";
import {
  addMyFoodItem,
  createRestaurant,
  deleteMyFoodItem,
  getFoodItems,
  getMyRestaurants,
  updateMyFoodItemAvailability,
  updateRestaurant,
} from "../services/restaurantService.js";
import { toast } from "../utils/toast.js";
import formatCurrency from "../utils/formatCurrency.js";

export default function MenuManagement() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [items, setItems] = useState([]);
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    description: "",
    phone: "",
    supportContact: "",
    address: "",
    localArea: "Main Bazaar",
    cuisineTypes: "Desi, Fast Food",
    opensAt: "11:00",
    closesAt: "23:30",
    logo: "",
    banner: "",
    ownerCnic: "",
    businessProof: "",
    taxRegistration: "",
    bankAccountType: "JazzCash",
    payoutAccountTitle: "",
    bankAccountNumber: "",
    deliveryPreference: "platform_riders",
    isOpen: true,
    kitchenLoad: "low",
    averagePreparationTime: 20,
    lat: 32.1020,
    lng: 74.8740,
  });

  const loadRestaurants = async () => {
    const res = await getMyRestaurants();
    const owned = res.data.data || [];
    setRestaurants(owned);
    const nextRestaurantId = selectedRestaurantId || owned[0]?._id || "";
    setSelectedRestaurantId(nextRestaurantId);
    if (nextRestaurantId) {
      const itemsRes = await getFoodItems(nextRestaurantId);
      setItems(itemsRes.data.data || []);
    } else {
      setItems([]);
    }
  };

  useEffect(() => {
    loadRestaurants().catch((err) => toast.error(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRestaurantId) return;
    getFoodItems(selectedRestaurantId)
      .then((res) => setItems(res.data.data || []))
      .catch((err) => toast.error(err.message));
    const selected = restaurants.find((restaurant) => restaurant._id === selectedRestaurantId);
    if (selected) {
      setRestaurantForm({
        name: selected.name || "",
        description: selected.description || "",
        phone: selected.phone || "",
        supportContact: selected.supportContact || "",
        address: selected.address || "",
        localArea: selected.localArea || "Main Bazaar",
        cuisineTypes: (selected.cuisineTypes || []).join(", "),
        opensAt: selected.businessHours?.opensAt || "11:00",
        closesAt: selected.businessHours?.closesAt || "23:30",
        logo: selected.logo || "",
        banner: selected.banner || "",
        ownerCnic: selected.ownerCnic || "",
        businessProof: selected.businessProof || "",
        taxRegistration: selected.taxRegistration || "",
        bankAccountType: selected.bankAccountType || "JazzCash",
        payoutAccountTitle: selected.payoutAccountTitle || "",
        bankAccountNumber: selected.bankAccountNumber || "",
        deliveryPreference: selected.deliveryPreference || "platform_riders",
        isOpen: selected.isOpen !== false,
        kitchenLoad: selected.kitchenLoad || "low",
        averagePreparationTime: selected.averagePreparationTime || 20,
        lat: selected.location?.lat || 32.1020,
        lng: selected.location?.lng || 74.8740,
      });
    }
  }, [selectedRestaurantId]);

  const submitRestaurant = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...restaurantForm,
        cuisineTypes: restaurantForm.cuisineTypes.split(",").map((item) => item.trim()).filter(Boolean),
        businessHours: { opensAt: restaurantForm.opensAt, closesAt: restaurantForm.closesAt },
        location: { lat: Number(restaurantForm.lat) || 32.1020, lng: Number(restaurantForm.lng) || 74.8740 },
      };
      if (selectedRestaurantId) await updateRestaurant(selectedRestaurantId, payload);
      else await createRestaurant(payload);
      toast.success("Restaurant profile saved");
      await loadRestaurants();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitItem = async ({ restaurantId, payload }) => {
    const targetRestaurantId = restaurantId || selectedRestaurantId || restaurants[0]?._id;
    if (!targetRestaurantId) return toast.error("Create a restaurant profile first");

    try {
      await addMyFoodItem(payload);
      toast.success("Food item added successfully");
      const res = await getFoodItems(targetRestaurantId);
      setItems(res.data.data || []);
      setSelectedRestaurantId(targetRestaurantId);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const res = await updateMyFoodItemAvailability(item._id, { isAvailable: !item.isAvailable, isOutOfStock: item.isAvailable });
      setItems((prev) => prev.map((existing) => existing._id === item._id ? res.data.data : existing));
      toast.success("Menu item updated");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeItem = async (item) => {
    try {
      await deleteMyFoodItem(item._id);
      setItems((prev) => prev.filter((existing) => existing._id !== item._id));
      toast.success("Menu item deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>Menu Management</h1>
        <p className="muted">
          Add food items with calories and tags for AI recommendation and health filtering.
        </p>

        <form className="card form" onSubmit={submitRestaurant}>
          <h3>Restaurant Profile</h3>
          <input className="input" placeholder="Restaurant Name" value={restaurantForm.name} onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })} />
          <input className="input" placeholder="Description" value={restaurantForm.description} onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })} />
          <input className="input" placeholder="Phone" value={restaurantForm.phone} onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })} />
          <input className="input" placeholder="Support contact phone" value={restaurantForm.supportContact} onChange={(e) => setRestaurantForm({ ...restaurantForm, supportContact: e.target.value })} />
          <input className="input" placeholder="Address" value={restaurantForm.address} onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })} />
          <select value={restaurantForm.localArea} onChange={(e) => setRestaurantForm({ ...restaurantForm, localArea: e.target.value })}>
            {["UET Narowal Campus", "Railway Road", "Zafarwal Road", "Circular Road", "Main Bazaar", "Shakargarh Road", "New Lahore Road", "DHQ Hospital Area", "Narowal Railway Station"].map((area) => <option key={area} value={area}>{area}</option>)}
          </select>
          <input className="input" placeholder="Cuisines: Desi, Fast Food" value={restaurantForm.cuisineTypes} onChange={(e) => setRestaurantForm({ ...restaurantForm, cuisineTypes: e.target.value })} />
          <div className="grid grid-2">
            <input className="input" type="time" value={restaurantForm.opensAt} onChange={(e) => setRestaurantForm({ ...restaurantForm, opensAt: e.target.value })} />
            <input className="input" type="time" value={restaurantForm.closesAt} onChange={(e) => setRestaurantForm({ ...restaurantForm, closesAt: e.target.value })} />
          </div>
          <input className="input" placeholder="Logo URL placeholder" value={restaurantForm.logo} onChange={(e) => setRestaurantForm({ ...restaurantForm, logo: e.target.value })} />
          <input className="input" placeholder="Banner URL placeholder" value={restaurantForm.banner} onChange={(e) => setRestaurantForm({ ...restaurantForm, banner: e.target.value })} />
          <input className="input" placeholder="Owner CNIC placeholder" value={restaurantForm.ownerCnic} onChange={(e) => setRestaurantForm({ ...restaurantForm, ownerCnic: e.target.value })} />
          <input className="input" placeholder="Business proof placeholder" value={restaurantForm.businessProof} onChange={(e) => setRestaurantForm({ ...restaurantForm, businessProof: e.target.value })} />
          <input className="input" placeholder="Tax/registration placeholder" value={restaurantForm.taxRegistration} onChange={(e) => setRestaurantForm({ ...restaurantForm, taxRegistration: e.target.value })} />
          <select value={restaurantForm.bankAccountType} onChange={(e) => setRestaurantForm({ ...restaurantForm, bankAccountType: e.target.value })}>
            <option value="JazzCash">JazzCash</option>
            <option value="EasyPaisa">EasyPaisa</option>
            <option value="HBL Konnect">HBL Konnect</option>
            <option value="Bank">Bank</option>
          </select>
          <input className="input" placeholder="Payout account title" value={restaurantForm.payoutAccountTitle} onChange={(e) => setRestaurantForm({ ...restaurantForm, payoutAccountTitle: e.target.value })} />
          <input className="input" placeholder="Payout account number" value={restaurantForm.bankAccountNumber} onChange={(e) => setRestaurantForm({ ...restaurantForm, bankAccountNumber: e.target.value })} />
          <select value={restaurantForm.deliveryPreference} onChange={(e) => setRestaurantForm({ ...restaurantForm, deliveryPreference: e.target.value })}>
            <option value="platform_riders">SmartFood platform riders</option>
            <option value="self_delivery">Self delivery</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <select value={restaurantForm.kitchenLoad} onChange={(e) => setRestaurantForm({ ...restaurantForm, kitchenLoad: e.target.value })}>
            <option value="low">Low kitchen load</option>
            <option value="medium">Medium kitchen load</option>
            <option value="high">High kitchen load</option>
          </select>
          <input className="input" type="number" min="5" placeholder="Preparation minutes" value={restaurantForm.averagePreparationTime} onChange={(e) => setRestaurantForm({ ...restaurantForm, averagePreparationTime: Number(e.target.value) })} />
          <div className="grid grid-2">
            <input className="input" type="number" step="0.0001" placeholder="Latitude" value={restaurantForm.lat} onChange={(e) => setRestaurantForm({ ...restaurantForm, lat: e.target.value })} />
            <input className="input" type="number" step="0.0001" placeholder="Longitude" value={restaurantForm.lng} onChange={(e) => setRestaurantForm({ ...restaurantForm, lng: e.target.value })} />
          </div>
          <iframe
            title="Restaurant Narowal location"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(restaurantForm.lng || 74.8740) - 0.006},${Number(restaurantForm.lat || 32.1020) - 0.006},${Number(restaurantForm.lng || 74.8740) + 0.006},${Number(restaurantForm.lat || 32.1020) + 0.006}&layer=mapnik&marker=${restaurantForm.lat || 32.1020},${restaurantForm.lng || 74.8740}`}
            loading="lazy"
            style={{ width: "100%", minHeight: 260, border: "1px solid var(--border)", borderRadius: 14 }}
          />
          <label>
            <input type="checkbox" checked={restaurantForm.isOpen} onChange={(e) => setRestaurantForm({ ...restaurantForm, isOpen: e.target.checked })} />
            {" "}Restaurant is open
          </label>
          <button className="btn">{selectedRestaurantId ? "Update Restaurant" : "Create Restaurant"}</button>
        </form>

        {restaurants.length > 0 && (
          <div className="card" style={{ marginTop: 18 }}>
            <h3>Active Restaurant</h3>
            <select value={selectedRestaurantId} onChange={(e) => setSelectedRestaurantId(e.target.value)}>
              {restaurants.map((restaurant) => (
                <option key={restaurant._id} value={restaurant._id}>{restaurant.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <MenuForm onSubmit={submitItem} restaurants={restaurants} />
        </div>

        <div className="grid" style={{ marginTop: 18 }}>
          {items.map((item) => (
            <div className="card" key={item._id}>
              <span className="badge">{item.isAvailable ? "Available" : "Hidden"}</span>
              {item.isFeatured && <span className="badge" style={{ marginLeft: 8 }}>Featured</span>}
              <h3>{item.name}</h3>
              <p className="muted">{item.description}</p>
              <p><b>{formatCurrency(item.price)}</b> - {item.calories || 0} kcal - {item.preparationTime || 15} min</p>
              <button className="btn outline" onClick={() => toggleAvailability(item)}>
                {item.isAvailable ? "Hide" : "Show"}
              </button>{" "}
              <button className="btn danger" onClick={() => removeItem(item)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
