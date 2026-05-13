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
      <div className="container cart-layout">
        <div>
          <span className="badge">Your basket</span>
          <h1>Cart</h1>
          <p className="muted">Review items, adjust quantities, and continue to Narowal COD checkout.</p>
          <div className="cart-stack">
            {cart.map((item) => <CartItem key={item._id} item={item} onRemove={remove} onQuantityChange={updateQuantity} />)}
            {cart.length === 0 && <div className="empty-state"><h3>Your cart is empty</h3><p>Browse Narowal restaurants and add something delicious.</p><Link className="btn" to="/restaurants">Browse Restaurants</Link></div>}
          </div>
        </div>

        <aside className="order-summary-card">
          <h3>Order Summary</h3>
          {cart.length === 0 ? (
            <div className="summary-empty">
              <h4>Your cart is empty</h4>
              <p className="muted">Browse restaurants to add items. Fees and totals will appear after you choose food.</p>
              <Link className="btn summary-btn" to="/restaurants">Browse Restaurants</Link>
            </div>
          ) : (
            <>
              <div className="summary-row"><span>Subtotal</span><b>{formatCurrency(totals.subtotal)}</b></div>
              <div className="summary-row"><span>Delivery Fee</span><b>{formatCurrency(totals.deliveryFee)}</b></div>
              <div className="summary-row"><span>Platform Fee</span><b>{formatCurrency(totals.platformFee)}</b></div>
              <div className="summary-row"><span>Service Fee</span><b>{formatCurrency(totals.serviceFee)}</b></div>
              <div className="summary-row total"><span>Total</span><b>{formatCurrency(totals.total)}</b></div>
              <p className="muted">Total Calories: <b>{totals.calories} kcal</b></p>
              <Link className="btn summary-btn" to="/checkout">Go to checkout</Link>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
