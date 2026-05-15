import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

const etaMinutes = (restaurant) => Number(restaurant.averagePreparationTime || (restaurant.kitchenLoad === "high" ? 28 : restaurant.kitchenLoad === "medium" ? 22 : 16)) + 12;
const kitchenLoadScore = (restaurant) => ({ low: 1, medium: 2, high: 3 }[restaurant.kitchenLoad] || 1);

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState([]);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [cuisine, setCuisine] = useState(searchParams.get("cuisine") || "");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sort, setSort] = useState("nearby");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getRestaurants()
      .then((res) => setRestaurants(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCuisine(searchParams.get("cuisine") || "");
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const cuisines = [...new Set(restaurants.flatMap((restaurant) => restaurant.cuisineTypes || []))].sort();
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const searchTerm = query.trim().toLowerCase();
    const menuKeywords = [
      ...(restaurant.menuKeywords || []),
      ...(restaurant.popularItems || []),
      ...(restaurant.foodKeywords || []),
    ];
    const searchable = [
      restaurant.name,
      restaurant.description,
      restaurant.address,
      restaurant.localArea,
      ...(restaurant.cuisineTypes || []),
      ...menuKeywords,
    ].filter(Boolean).join(" ").toLowerCase();
    const matchesQuery = !searchTerm || searchable.includes(searchTerm);
    const matchesCuisine = !cuisine || restaurant.cuisineTypes?.includes(cuisine);
    const matchesOpen = !onlyOpen || restaurant.isOpen === true;
    return matchesQuery && matchesCuisine && matchesOpen;
  }).sort((a, b) => {
    if (sort === "rating") return (b.rating || 0) - (a.rating || 0);
    if (sort === "delivery") return (a.deliveryFeeBase || 125) - (b.deliveryFeeBase || 125);
    if (sort === "eta") return etaMinutes(a) - etaMinutes(b);
    if (sort === "kitchen") return kitchenLoadScore(a) - kitchenLoadScore(b);
    return distanceKm(USER_LOCATION, a.location || USER_LOCATION) - distanceKm(USER_LOCATION, b.location || USER_LOCATION);
  });

  return (
    <section className="page listing-page">
      <div className="container">
        <div className="listing-head">
          <div>
            <span className="badge">Narowal restaurants</span>
            <h1>Restaurants delivering near you</h1>
            <p className="muted">Search local kitchens, compare ETA, fees, ratings, and kitchen load.</p>
          </div>
          <div className="listing-count">{filteredRestaurants.length} places</div>
        </div>
        <div className="listing-layout">
          <aside className="filter-panel">
            <h3>Filters</h3>
            <input className="input" placeholder="Search food or restaurant" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
              <option value="">All cuisines</option>
              {cuisines.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="nearby">Nearest first</option>
              <option value="rating">Highest rated</option>
              <option value="delivery">Lowest delivery fee</option>
              <option value="eta">Fastest ETA</option>
              <option value="kitchen">Lowest kitchen load</option>
            </select>
            <label className="check-row"><input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} /> Open now</label>
          </aside>
          <div>
        {loading && <Loading />}
        <ErrorMessage message={error} />
        {!loading && filteredRestaurants.length === 0 && (
          <div className="empty-state"><h3>No restaurants found</h3><p>Try another Narowal area, cuisine, or search term.</p></div>
        )}
        <div className="grid grid-3">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant._id} restaurant={restaurant} />
          ))}
        </div>
          </div>
        </div>
      </div>
    </section>
  );
}
