import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeatMapPlaceholder from "../components/map/HeatMapPlaceholder.jsx";
import RestaurantCard from "../components/restaurant/RestaurantCard.jsx";
import FoodCard from "../components/food/FoodCard.jsx";
import { filterFoodByGoal, getRecommendations } from "../services/aiService.js";
import { getRestaurants, getRestaurantItems } from "../services/restaurantService.js";
import { addToCart } from "../store/cartStore.js";
import { toast } from "../utils/toast.js";

const categories = ["Biryani", "Karahi", "Burger", "Pizza", "BBQ", "Bakery", "Tea", "Healthy"];
const areas = ["UET Narowal Campus", "Railway Road", "Main Bazaar", "Circular Road", "Zafarwal Road", "DHQ Hospital", "Narowal Railway Station"];

export default function Home() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [foods, setFoods] = useState([]);
  const [aiFoods, setAiFoods] = useState([]);
  const [healthFoods, setHealthFoods] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getRestaurants().then(async (res) => {
      const list = res.data.data || [];
      setRestaurants(list);
      const menuResponses = await Promise.all(list.slice(0, 4).map((restaurant) => getRestaurantItems(restaurant._id)));
      const nextFoods = menuResponses.flatMap((menuRes, index) => (menuRes.data.data || []).slice(0, 2).map((item) => ({ ...item, restaurantName: list[index]?.name })));
      setFoods(nextFoods);
      getRecommendations().then((aiRes) => {
        const recommended = aiRes.data.data || [];
        setAiFoods(recommended.map((item) => nextFoods.find((food) => String(food._id) === String(item.id || item._id)) || item).filter((item) => item.restaurant || item._id));
      }).catch(() => setAiFoods([]));
      filterFoodByGoal({ goal: "balanced", items: nextFoods }).then((aiRes) => setHealthFoods(aiRes.data.data || [])).catch(() => setHealthFoods([]));
    }).catch(() => {});
  }, []);

  const featured = useMemo(() => restaurants.filter((item) => item.isFeatured || item.rating >= 4.4).slice(0, 3), [restaurants]);
  const trending = useMemo(() => restaurants.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3), [restaurants]);
  const popularNearYou = useMemo(() => restaurants.slice(3, 7), [restaurants]);

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/restaurants${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`);
  };

  return (
    <>
      <section className="market-hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="badge hero-badge">Delivering to Narowal</span>
            <h1>Food, groceries, and local favourites delivered across Narowal.</h1>
            <p>Order from trusted Narowal restaurants with COD, live tracking, loyalty points, and smart delivery estimates.</p>
            <form className="hero-search" onSubmit={submitSearch}>
              <select aria-label="Delivery area">
                {areas.map((area) => <option key={area}>{area}</option>)}
              </select>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search biryani, burgers, pizza or restaurants" />
              <button className="btn">Find food</button>
            </form>
            <div className="quick-areas">
              {areas.slice(0, 5).map((area) => <Link key={area} to={`/restaurants?q=${encodeURIComponent(area)}`}>{area}</Link>)}
            </div>
          </div>
          <div className="hero-deal-card">
            <span className="badge success">COD default</span>
            <h2>NAROWAL50</h2>
            <p>PKR 50 off local orders above PKR 350.</p>
            <div className="deal-stats">
              <span><b>30-45</b><small>min ETA</small></span>
              <span><b>PKR</b><small>local pricing</small></span>
              <span><b>OTP</b><small>secure delivery</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="page">
        <div className="container">
          <div className="category-strip">
            {categories.map((category) => <Link className="category-tile" key={category} to={`/restaurants?cuisine=${category}`}><span>{category}</span></Link>)}
          </div>
        </div>
      </section>

      <section className="page section-tight">
        <div className="container">
          <div className="promo-grid">
            <div className="promo-card">
              <span className="badge">Lunch rush</span>
              <h3>Main Bazaar favourites</h3>
              <p>Fast COD delivery from City Restaurant, Anbala, and more.</p>
            </div>
            <div className="promo-card dark">
              <span className="badge success">Student deals</span>
              <h3>UET Narowal Campus</h3>
              <p>Budget meals, burgers, biryani, and tea near campus.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="page section-tight">
        <div className="container">
          <div className="section-head">
            <h2>Featured Restaurants</h2>
            <Link to="/restaurants">View all</Link>
          </div>
          <div className="grid grid-3">
            {(featured.length ? featured : restaurants.slice(0, 3)).map((restaurant) => (
              <RestaurantCard key={restaurant._id} restaurant={restaurant} />
            ))}
          </div>
        </div>
      </section>

      <section className="page soft-band">
        <div className="container">
          <div className="section-head">
            <h2>Recommended Food</h2>
            <span className="muted">Based on Narowal demand and kitchen freshness</span>
          </div>
          <div className="grid grid-3">
            {(aiFoods.length ? aiFoods : foods).slice(0, 6).map((item) => (
              <FoodCard key={item._id} item={item} onAdd={(food) => {
                addToCart({ ...food, restaurant: food.restaurant });
                toast.success("Added to cart");
              }} />
            ))}
          </div>
        </div>
      </section>

      <section className="page">
        <div className="container">
          <div className="section-head">
            <h2>Popular Near You</h2>
            <span className="muted">High-rated Narowal kitchens</span>
          </div>
          <div className="grid grid-3">
            {(popularNearYou.length ? popularNearYou : trending).map((restaurant) => <RestaurantCard key={restaurant._id} restaurant={restaurant} />)}
          </div>
        </div>
      </section>

      <section className="page">
        <div className="container">
          <HeatMapPlaceholder />
          {healthFoods.length > 0 && (
            <div className="card" style={{ marginTop: 18 }}>
              <span className="badge success">AI health picks</span>
              <h3>Balanced Narowal choices</h3>
              <p className="muted">{healthFoods.slice(0, 3).map((item) => item.name).join(", ")}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
