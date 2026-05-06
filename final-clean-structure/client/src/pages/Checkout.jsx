import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../services/orderService.js";
import { clearCart, getCart, cartTotals } from "../store/cartStore.js";
import { toast } from "../utils/toast.js";

export default function Checkout() {
  const navigate = useNavigate();
  const cart = getCart();
  const totals = cartTotals(cart);
  const [form, setForm] = useState({
    deliveryAddress: "",
    paymentMethod: "cod",
    emergencyMode: false,
  });

  const submit = async (e) => {
    e.preventDefault();

    if (!cart.length) return toast.error("Cart is empty");

    const restaurant = cart[0].restaurant;
    const payload = {
      restaurant,
      items: cart.map((item) => ({ foodItem: item._id, quantity: item.quantity })),
      deliveryAddress: form.deliveryAddress,
      deliveryLocation: { lat: 32.101, lng: 74.873 },
      paymentMethod: form.paymentMethod,
      emergencyMode: form.emergencyMode,
      distanceKm: 3,
    };

    try {
      await createOrder(payload);
      clearCart();
      toast.success("Order placed successfully");
      navigate("/orders");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <form className="card form" onSubmit={submit}>
          <h1>Checkout</h1>
          <p className="muted">Subtotal: Rs. {totals.subtotal}</p>
          <textarea rows="3" placeholder="Delivery address" value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} />
          <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
            <option value="cod">Cash on Delivery</option>
            <option value="card">Card</option>
            <option value="wallet">Wallet</option>
          </select>
          <label>
            <input type="checkbox" checked={form.emergencyMode} onChange={(e) => setForm({ ...form, emergencyMode: e.target.checked })} />
            {" "}Emergency Food Mode
          </label>
          <button className="btn">Place Order</button>
        </form>
      </div>
    </section>
  );
}
