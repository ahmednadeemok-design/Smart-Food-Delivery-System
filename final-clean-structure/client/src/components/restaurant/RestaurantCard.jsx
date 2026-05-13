import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge.jsx";

export default function RestaurantCard({ restaurant }) {
  const prepTime = restaurant.averagePreparationTime || (restaurant.kitchenLoad === "high" ? 28 : restaurant.kitchenLoad === "medium" ? 22 : 16);
  const deliveryEstimate = prepTime + 12;
  const deliveryFee = restaurant.localArea === "Main Bazaar" ? 80 : restaurant.localArea === "UET Narowal Campus" ? 140 : 125;

  return (
    <Link to={`/restaurants/${restaurant._id}`} className="card restaurant-card">
      <div className="media-wrap">
        {restaurant.offerText && <span className="floating-offer">{restaurant.offerText}</span>}
        <img
          src={restaurant.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=900"}
          alt={restaurant.name}
          loading="lazy"
          decoding="async"
        />
        <div className="restaurant-media-meta">
          <span>{deliveryEstimate} min</span>
          <span>Rs. {deliveryFee}</span>
        </div>
      </div>
      <div className="restaurant-card-body">
        <div className="restaurant-card-title">
          <h3>{restaurant.name}</h3>
          <span className="rating-chip">★ {restaurant.rating || 0}</span>
        </div>
        <p className="muted restaurant-cuisines">{(restaurant.cuisineTypes || []).slice(0, 3).join(" / ") || "Fresh food with smart delivery."}</p>
        <p className="muted restaurant-address">{restaurant.address || "Narowal city"}</p>
      </div>
      <div className="restaurant-card-badges">
        <StatusBadge value={`Kitchen: ${restaurant.kitchenLoad || "low"}`} />
        <StatusBadge value={restaurant.isOpen === false ? "Closed" : "Open"} />
        <span className="badge">Min Rs. 350</span>
        <span className="badge">Trust {restaurant.trustScore || 100}</span>
      </div>
    </Link>
  );
}
