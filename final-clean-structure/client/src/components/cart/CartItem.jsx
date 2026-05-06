import formatCurrency from "../../utils/formatCurrency.js";

export default function CartItem({ item, onRemove, onQuantityChange }) {
  return (
    <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h3>{item.name}</h3>
        <p className="muted">Calories: {(item.calories || 0) * item.quantity}</p>
        <input
          className="input"
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => onQuantityChange(item._id, e.target.value)}
          style={{ maxWidth: 90 }}
        />
      </div>
      <div style={{ textAlign: "right" }}>
        <b>{formatCurrency(item.price * item.quantity)}</b>
        <br />
        <button className="btn outline" onClick={() => onRemove(item._id)}>Remove</button>
      </div>
    </div>
  );
}
