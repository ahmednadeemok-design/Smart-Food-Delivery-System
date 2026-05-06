import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CartItem from "../components/cart/CartItem.jsx";
import { cartTotals, getCart, removeFromCart, updateCartQuantity } from "../store/cartStore.js";
import formatCurrency from "../utils/formatCurrency.js";

export default function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => setCart(getCart()), []);

  const remove = (id) => setCart(removeFromCart(id));
  const updateQuantity = (id, quantity) => setCart(updateCartQuantity(id, quantity));
  const totals = cartTotals(cart);

  return (
    <section className="page">
      <div className="container">
        <h1>Your Cart</h1>
        <div className="grid">
          {cart.map((item) => <CartItem key={item._id} item={item} onRemove={remove} onQuantityChange={updateQuantity} />)}
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <h3>Summary</h3>
          <p>Subtotal: <b>{formatCurrency(totals.subtotal)}</b></p>
          <p>Delivery Fee: <b>{formatCurrency(totals.deliveryFee)}</b></p>
          <p>Platform Fee: <b>{formatCurrency(totals.platformFee)}</b></p>
          <p>Service Fee: <b>{formatCurrency(totals.serviceFee)}</b></p>
          <p>Total: <b>{formatCurrency(totals.total)}</b></p>
          <p>Total Calories: <b>{totals.calories} kcal</b></p>
          {cart.length ? <Link className="btn" to="/checkout">Checkout</Link> : <Link className="btn" to="/restaurants">Browse Restaurants</Link>}
        </div>
      </div>
    </section>
  );
}
