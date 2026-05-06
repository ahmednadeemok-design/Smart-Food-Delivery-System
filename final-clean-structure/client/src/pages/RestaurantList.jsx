import { useEffect, useState } from "react";
import RestaurantCard from "../components/restaurant/RestaurantCard.jsx";
import Loading from "../components/common/Loading.jsx";
import ErrorMessage from "../components/common/ErrorMessage.jsx";
import { getRestaurants } from "../services/restaurantService.js";

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getRestaurants()
      .then((res) => setRestaurants(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page">
      <div className="container">
        <h1>Restaurants</h1>
        <p className="muted">Restaurants with kitchen load, accuracy prediction, and trust score.</p>
        {loading && <Loading />}
        <ErrorMessage message={error} />
        {!loading && restaurants.length === 0 && (
          <div className="card">
            No restaurants found. Create restaurant from backend/API first.
          </div>
        )}
        <div className="grid grid-3">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant._id} restaurant={restaurant} />
          ))}
        </div>
      </div>
    </section>
  );
}
