import { useEffect, useState } from "react";
import RestaurantCard from "../components/restaurant/RestaurantCard.jsx";
import Loading from "../components/common/Loading.jsx";
import ErrorMessage from "../components/common/ErrorMessage.jsx";
import { getRestaurants } from "../services/restaurantService.js";

// approximate coordinates for demo
const USER_LOCATION = { lat: 32.1020, lng: 74.8740 };
const distanceKm = (a, b) => {
  const latKm = (Number(a.lat) - Number(b.lat)) * 111;
  const lngKm = (Number(a.lng) - Number(b.lng)) * 94;
  return Math.sqrt(latKm ** 2 + lngKm ** 2);
};

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState([]);
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getRestaurants()
      .then((res) => setRestaurants(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const cuisines = [...new Set(restaurants.flatMap((restaurant) => restaurant.cuisineTypes || []))];
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const searchable = [restaurant.name, restaurant.description, restaurant.address].join(" ").toLowerCase();
    const matchesQuery = searchable.includes(query.toLowerCase());
    const matchesCuisine = !cuisine || restaurant.cuisineTypes?.includes(cuisine);
    return matchesQuery && matchesCuisine;
  }).sort((a, b) => distanceKm(USER_LOCATION, a.location || USER_LOCATION) - distanceKm(USER_LOCATION, b.location || USER_LOCATION));

  return (
    <section className="page">
      <div className="container">
        <h1>Restaurants</h1>
        <p className="muted">Nearby Narowal restaurants sorted from the city center with kitchen load, accuracy prediction, and trust score.</p>
        <div className="card form" style={{ marginBottom: 18 }}>
          <input className="input" placeholder="Search restaurants in Narowal" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
            <option value="">All cuisines</option>
            {cuisines.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        {loading && <Loading />}
        <ErrorMessage message={error} />
        {!loading && filteredRestaurants.length === 0 && (
          <div className="card">No restaurants found.</div>
        )}
        <div className="grid grid-3">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant._id} restaurant={restaurant} />
          ))}
        </div>
      </div>
    </section>
  );
}
