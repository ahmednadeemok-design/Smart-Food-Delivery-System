import { Link } from "react-router-dom";

export default function RestaurantCard({ restaurant }) {
  const prepTime = restaurant.averagePreparationTime || (restaurant.kitchenLoad === "high" ? 28 : restaurant.kitchenLoad === "medium" ? 22 : 16);
  const deliveryEstimate = prepTime + 12;
  const deliveryFee = restaurant.localArea === "Main Bazaar" ? 80 : restaurant.localArea === "UET Narowal Campus" ? 140 : 125;

  return (
    <Link to={`/restaurants/${restaurant._id}`} className="card restaurant-card">
      <img
        src={restaurant.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=900"}
        alt={restaurant.name}
      />
      <h3>{restaurant.name}</h3>
      <p className="muted">{restaurant.description || "Fresh food with smart delivery."}</p>
      <p className="muted">{restaurant.address || "Narowal city"}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span className="badge">Rating: {restaurant.rating || 0}</span>
        <span className="badge">Kitchen: {restaurant.kitchenLoad}</span>
        <span className="badge">{restaurant.isOpen === false ? "Closed" : "Open"}</span>
        <span className="badge">{deliveryEstimate} min</span>
        <span className="badge">Delivery Rs. {deliveryFee}</span>
        <span className="badge">Trust: {restaurant.trustScore}</span>
        <span className="badge">Accuracy: {restaurant.accuracyRate}%</span>
      </div>
    </Link>
  );
}
