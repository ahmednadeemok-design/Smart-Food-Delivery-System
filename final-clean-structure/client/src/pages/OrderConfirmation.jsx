import { Link, useLocation } from "react-router-dom";
import formatCurrency from "../utils/formatCurrency.js";

export default function OrderConfirmation() {
  const { state } = useLocation();
  const order = state?.order;

  return (
    <section className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="card">
          <span className="badge success">Order Confirmed</span>
          <h1>Food is on the way</h1>
          <p className="muted">Your COD order has been received and sent to the restaurant.</p>
          {order ? (
            <>
              <p><b>Order:</b> #{order._id.slice(-6)}</p>
              <p><b>Total:</b> {formatCurrency(order.totalAmount)}</p>
              <p><b>Delivery Address:</b> {order.deliveryAddress}</p>
              <p><b>Estimated Time:</b> {order.estimatedDeliveryTime || 35} minutes</p>
            </>
          ) : (
            <p className="muted">Open order tracking to view your latest order.</p>
          )}
          <div className="action-row">
            <Link className="btn" to="/orders">Track Order</Link>
            <Link className="btn outline" to="/restaurants">Order More</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
