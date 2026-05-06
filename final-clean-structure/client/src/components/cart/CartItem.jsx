import formatCurrency from "../../utils/formatCurrency.js";

export default function CartItem({ item, onRemove }) {
  return (
    <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h3>{item.name}</h3>
        <p className="muted">Qty: {item.quantity} • Calories: {(item.calories || 0) * item.quantity}</p>
      </div>
      <div style={{ textAlign: "right" }}>
        <b>{formatCurrency(item.price * item.quantity)}</b>
        <br />
        <button className="btn outline" onClick={() => onRemove(item._id)}>Remove</button>
      </div>
    </div>
  );
}
