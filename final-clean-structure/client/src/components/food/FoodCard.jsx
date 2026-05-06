import formatCurrency from "../../utils/formatCurrency.js";

export default function FoodCard({ item, onAdd }) {
  return (
    <div className="card food-card">
      <img
        src={item.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=900"}
        alt={item.name}
      />
      <h3>{item.name}</h3>
      <p className="muted">{item.description || "Tasty and freshly prepared."}</p>
      <p><b>{formatCurrency(item.price)}</b></p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <span className="badge">{item.calories || 0} kcal</span>
        <span className="badge">Taste {item.tasteScore || 100}%</span>
      </div>
      <button className="btn" onClick={() => onAdd(item)}>Add to Cart</button>
    </div>
  );
}
