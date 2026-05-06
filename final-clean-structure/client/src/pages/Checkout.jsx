import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../services/orderService.js";
import { clearCart, getCart, cartTotals } from "../store/cartStore.js";
import { toast } from "../utils/toast.js";
import formatCurrency from "../utils/formatCurrency.js";
import SmartMap from "../components/map/SmartMap.jsx";

const SAVED_ADDRESS_KEY = "smart_food_saved_address";
const NAROWAL_ADDRESSES = [
  "UET Narowal Campus, Hostel Gate, Narowal",
  "Railway Road, near Narowal Railway Station",
  "Zafarwal Road, Narowal",
  "Circular Road, near Narowal City Center",
  "Main Bazaar, Narowal",
  "Shakargarh Road, Narowal",
  "New Lahore Road, Narowal",
  "DHQ Hospital area, Narowal",
];

// approximate coordinates for demo
const ADDRESS_LOCATIONS = {
  "UET Narowal Campus, Hostel Gate, Narowal": { lat: 32.1135, lng: 74.8734 },
  "Railway Road, near Narowal Railway Station": { lat: 32.0990, lng: 74.8678 },
  "Zafarwal Road, Narowal": { lat: 32.0975, lng: 74.8842 },
  "Circular Road, near Narowal City Center": { lat: 32.1020, lng: 74.8725 },
  "Main Bazaar, Narowal": { lat: 32.1008, lng: 74.8712 },
  "Shakargarh Road, Narowal": { lat: 32.1071, lng: 74.8669 },
  "New Lahore Road, Narowal": { lat: 32.0954, lng: 74.8788 },
  "DHQ Hospital area, Narowal": { lat: 32.1058, lng: 74.8792 },
};

export default function Checkout() {
  const navigate = useNavigate();
  const cart = getCart();
  const totals = cartTotals(cart);
  const [form, setForm] = useState({
    deliveryAddress: localStorage.getItem(SAVED_ADDRESS_KEY) || "",
    paymentMethod: "cod",
    emergencyMode: false,
    deliveryLocation: ADDRESS_LOCATIONS[localStorage.getItem(SAVED_ADDRESS_KEY)] || { lat: 32.1020, lng: 74.8740 },
  });

  const submit = async (e) => {
    e.preventDefault();

    if (!cart.length) return toast.error("Cart is empty");
    if (form.deliveryAddress.trim().length < 10) return toast.error("Please enter a complete delivery address");
    if (new Set(cart.map((item) => item.restaurant)).size > 1) return toast.error("Please order from one restaurant at a time");

    const restaurant = cart[0].restaurant;
    const selectedLocation = form.deliveryLocation || ADDRESS_LOCATIONS[form.deliveryAddress] || { lat: 32.1020, lng: 74.8740 };
    localStorage.setItem(SAVED_ADDRESS_KEY, form.deliveryAddress.trim());
    const payload = {
      restaurant,
      items: cart.map((item) => ({ foodItem: item._id, quantity: item.quantity })),
      deliveryAddress: form.deliveryAddress.trim(),
      deliveryLocation: selectedLocation,
      paymentMethod: form.paymentMethod,
      emergencyMode: form.emergencyMode,
      distanceKm: 3,
    };

    try {
      const res = await createOrder(payload);
      clearCart();
      toast.success("Order placed successfully");
      navigate("/order-confirmation", { state: { order: res.data.data } });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <form className="card form" onSubmit={submit}>
          <h1>Checkout</h1>
          <p className="muted">Narowal delivery with COD as the default payment method.</p>
          <select value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value, deliveryLocation: ADDRESS_LOCATIONS[e.target.value] || form.deliveryLocation })}>
            <option value="">Choose saved Narowal area or type below</option>
            {NAROWAL_ADDRESSES.map((address) => <option key={address} value={address}>{address}</option>)}
          </select>
          <textarea rows="3" placeholder="Delivery address" value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} />
          <SmartMap
            points={[{ label: "Delivery pin", ...(form.deliveryLocation || ADDRESS_LOCATIONS[form.deliveryAddress] || { lat: 32.1020, lng: 74.8740 }) }]}
            onPick={(deliveryLocation) => setForm({ ...form, deliveryLocation })}
          />
          <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
            <option value="cod">Cash on Delivery</option>
            <option value="card">Card</option>
            <option value="wallet">Wallet</option>
          </select>
          <label>
            <input type="checkbox" checked={form.emergencyMode} onChange={(e) => setForm({ ...form, emergencyMode: e.target.checked })} />
            {" "}Emergency Food Mode
          </label>
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
            <h3>Payment Summary</h3>
            <p>Subtotal: <b>{formatCurrency(totals.subtotal)}</b></p>
            <p>Delivery Fee Estimate: <b>{formatCurrency(totals.deliveryFee)}</b></p>
            <p>Platform Fee: <b>{formatCurrency(totals.platformFee)}</b></p>
            <p>Service Fee: <b>{formatCurrency(totals.serviceFee)}</b></p>
            <p>Total Estimate: <b>{formatCurrency(totals.total)}</b></p>
          </div>
          <button className="btn">Place Order</button>
        </form>
      </div>
    </section>
  );
}
