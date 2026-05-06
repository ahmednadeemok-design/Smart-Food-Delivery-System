import { Link } from "react-router-dom";

export default function RestaurantCard({ restaurant }) {
  return (
    <Link to={`/restaurants/${restaurant._id}`} className="card restaurant-card">
      <img
        src={restaurant.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=900"}
        alt={restaurant.name}
      />
      <h3>{restaurant.name}</h3>
      <p className="muted">{restaurant.description || "Fresh food with smart delivery."}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span className="badge">Kitchen: {restaurant.kitchenLoad}</span>
        <span className="badge">Trust: {restaurant.trustScore}</span>
        <span className="badge">Accuracy: {restaurant.accuracyRate}%</span>
      </div>
    </Link>
  );
}
