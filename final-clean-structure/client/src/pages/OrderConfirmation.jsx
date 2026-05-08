import { Link, useLocation } from "react-router-dom";
import formatCurrency from "../utils/formatCurrency.js";

export default function OrderConfirmation() {
  const { state } = useLocation();
  const order = state?.order;

  return (
    <section className="page">
      <div className="container confirmation-wrap">
        <div className="card confirmation-card">
          <span className="badge success">Order Confirmed</span>
          <h1>Food is on the way</h1>
          <p className="muted">Your COD order has been received and sent to the restaurant.</p>
          {order ? (
            <>
              <div className="confirmation-grid">
                <span><b>Order</b><small>#{order._id.slice(-6)}</small></span>
                <span><b>Total</b><small>{formatCurrency(order.totalAmount)}</small></span>
                <span><b>ETA</b><small>{order.estimatedDeliveryTime || 35} minutes</small></span>
              </div>
              <p><b>Delivery Address:</b> {order.deliveryAddress}</p>
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
