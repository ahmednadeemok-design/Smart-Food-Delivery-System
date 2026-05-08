import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../services/orderService.js";
import { clearCart, getCart, cartTotals } from "../store/cartStore.js";
import { toast } from "../utils/toast.js";
import formatCurrency from "../utils/formatCurrency.js";
import SmartMap from "../components/map/SmartMap.jsx";
import { useAuth } from "../store/AuthContext.jsx";

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
  const { user, refreshProfile } = useAuth();
  const cart = getCart();
  const totals = cartTotals(cart);
  const [form, setForm] = useState({
    deliveryAddress: localStorage.getItem(SAVED_ADDRESS_KEY) || "",
    paymentMethod: "cod",
    couponCode: "",
    loyaltyPointsRedeemed: 0,
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
      couponCode: form.couponCode,
      loyaltyPointsRedeemed: Number(form.loyaltyPointsRedeemed || 0),
      emergencyMode: form.emergencyMode,
      distanceKm: 3,
    };

    try {
      const res = await createOrder(payload);
      clearCart();
      await refreshProfile();
      toast.success("Order placed successfully");
      navigate("/order-confirmation", { state: { order: res.data.data } });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container checkout-layout">
        <form className="card form checkout-card" onSubmit={submit}>
          <span className="badge">Secure COD checkout</span>
          <h1>Checkout</h1>
          <p className="muted">Choose a Narowal delivery point, confirm COD, and place your order.</p>
          {user?.savedAddresses?.length > 0 && (
            <select value={form.deliveryAddress} onChange={(e) => {
              const picked = user.savedAddresses.find((item) => item.address === e.target.value);
              setForm({ ...form, deliveryAddress: e.target.value, deliveryLocation: picked?.location || form.deliveryLocation });
            }}>
              <option value="">Saved addresses</option>
              {user.savedAddresses.map((item) => <option key={item._id} value={item.address}>{item.label} - {item.address}</option>)}
            </select>
          )}
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
          </select>
          <input className="input" placeholder="Coupon code: NAROWAL50, UET100, BAZAAR10" value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value.toUpperCase() })} />
          <input className="input" type="number" min="0" max={user?.loyalty?.points || 0} placeholder={`Redeem points (${user?.loyalty?.points || 0} available)`} value={form.loyaltyPointsRedeemed} onChange={(e) => setForm({ ...form, loyaltyPointsRedeemed: e.target.value })} />
          <label>
            <input type="checkbox" checked={form.emergencyMode} onChange={(e) => setForm({ ...form, emergencyMode: e.target.checked })} />
            {" "}Emergency Food Mode
          </label>
          <button className="btn">Place Order</button>
        </form>
        <aside className="order-summary-card">
          <h3>Payment Summary</h3>
          <div className="summary-row"><span>Subtotal</span><b>{formatCurrency(totals.subtotal)}</b></div>
          <div className="summary-row"><span>Delivery estimate</span><b>{formatCurrency(totals.deliveryFee)}</b></div>
          <div className="summary-row"><span>Platform fee</span><b>{formatCurrency(totals.platformFee)}</b></div>
          <div className="summary-row"><span>Service fee</span><b>{formatCurrency(totals.serviceFee)}</b></div>
          <div className="summary-row total"><span>Total estimate</span><b>{formatCurrency(totals.total)}</b></div>
          <p className="muted">Payment method: Cash on Delivery</p>
          <p className="muted">Loyalty: {user?.loyalty?.points || 0} points available</p>
        </aside>
      </div>
    </section>
  );
}
