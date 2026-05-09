import formatCurrency from "../../utils/formatCurrency.js";
import StatusBadge from "../common/StatusBadge.jsx";

export default function FoodCard({ item, onAdd, variant = "menu" }) {
  const isRecommended = variant === "recommended";
  const className = isRecommended ? "card food-card recommended-food-card" : "card food-card menu-item-card";

  return (
    <div className={className}>
      <div className="food-card-media">
        <img
          src={item.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=900"}
          alt={item.name}
        />
        {isRecommended && <span className="food-card-float">AI pick</span>}
      </div>
      <div className={isRecommended ? "recommended-food-body" : "menu-item-body"}>
        <div className="food-title-block">
          <h3>{item.name}</h3>
          {isRecommended && <p className="food-restaurant">{item.restaurantName || item.restaurant?.name || "SmartFood Narowal partner"}</p>}
        </div>
        <p className={isRecommended ? "muted food-description clamp-2" : "muted"}>{item.description || "Freshly prepared Narowal favourite with reliable COD delivery."}</p>
        <div className="food-badges">
          <span className="badge">{item.calories || 0} kcal</span>
          <span className="badge">Taste {item.tasteScore || 100}%</span>
          {item.addOns?.length > 0 && <span className="badge">Add-ons</span>}
          {item.isAvailable === false && <StatusBadge value="Unavailable" />}
        </div>
        <div className="recommended-food-footer">
          <p className="food-price"><b>{formatCurrency(item.price)}</b></p>
          <button className="btn" disabled={item.isAvailable === false} onClick={() => onAdd(item)}>
            {isRecommended ? "Add to cart" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
