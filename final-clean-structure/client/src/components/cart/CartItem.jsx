import formatCurrency from "../../utils/formatCurrency.js";

export default function CartItem({ item, onRemove, onQuantityChange }) {
  return (
    <div className="cart-line">
      <div>
        <h3>{item.name}</h3>
        <p className="muted">Calories: {(item.calories || 0) * item.quantity}</p>
        <div className="quantity-stepper">
          <button type="button" onClick={() => onQuantityChange(item._id, item.quantity - 1)}>-</button>
          <span>{item.quantity}</span>
          <button type="button" onClick={() => onQuantityChange(item._id, item.quantity + 1)}>+</button>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <b>{formatCurrency(item.price * item.quantity)}</b>
        <br />
        <button className="btn outline" onClick={() => onRemove(item._id)}>Remove</button>
      </div>
    </div>
  );
}
