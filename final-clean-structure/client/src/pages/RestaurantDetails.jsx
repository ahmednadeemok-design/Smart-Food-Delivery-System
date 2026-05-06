import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FoodCard from "../components/food/FoodCard.jsx";
import Loading from "../components/common/Loading.jsx";
import ErrorMessage from "../components/common/ErrorMessage.jsx";
import { getRestaurantById, getRestaurantItems } from "../services/restaurantService.js";
import { addToCart } from "../store/cartStore.js";
import { toast } from "../utils/toast.js";

export default function RestaurantDetails() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getRestaurantById(id), getRestaurantItems(id)])
      .then(([restaurantRes, itemsRes]) => {
        setRestaurant(restaurantRes.data.data);
        setItems(itemsRes.data.data);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const handleAdd = (item) => {
    addToCart({ ...item, restaurant: id });
    toast.success("Added to cart");
  };

  if (!restaurant && !error) return <section className="page"><div className="container"><Loading /></div></section>;

  return (
    <section className="page">
      <div className="container">
        <ErrorMessage message={error} />
        {restaurant && (
          <>
            <div className="card">
              <span className="badge">Kitchen Load: {restaurant.kitchenLoad}</span>
              <h1>{restaurant.name}</h1>
              <p className="muted">{restaurant.description}</p>
              <p><b>Address:</b> {restaurant.address || "Not provided"}</p>
            </div>

            <h2 style={{ marginTop: 28 }}>Menu</h2>
            {items.length === 0 && <div className="card">No food items found.</div>}
            <div className="grid grid-3">
              {items.map((item) => (
                <FoodCard key={item._id} item={item} onAdd={handleAdd} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
