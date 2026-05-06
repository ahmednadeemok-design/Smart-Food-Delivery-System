import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FoodCard from "../components/food/FoodCard.jsx";
import Loading from "../components/common/Loading.jsx";
import ErrorMessage from "../components/common/ErrorMessage.jsx";
import { getRestaurantById, getRestaurantItems, getRestaurantReviews } from "../services/restaurantService.js";
import { createReview } from "../services/reviewService.js";
import { addToCart } from "../store/cartStore.js";
import { toast } from "../utils/toast.js";
import SmartMap from "../components/map/SmartMap.jsx";

export default function RestaurantDetails() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [category, setCategory] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getRestaurantById(id), getRestaurantItems(id), getRestaurantReviews(id)])
      .then(([restaurantRes, itemsRes, reviewsRes]) => {
        setRestaurant(restaurantRes.data.data);
        setItems(itemsRes.data.data);
        setReviews(reviewsRes.data.data || []);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const handleAdd = (item) => {
    addToCart({ ...item, restaurant: id });
    toast.success("Added to cart");
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const res = await createReview({ restaurant: id, rating: Number(reviewForm.rating), comment: reviewForm.comment });
      setReviews((prev) => [res.data.data, ...prev]);
      setReviewForm({ rating: 5, comment: "" });
      toast.success("Review submitted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!restaurant && !error) return <section className="page"><div className="container"><Loading /></div></section>;

  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
  const visibleItems = items.filter((item) => item.isAvailable !== false && (!category || item.category === category));
  const deliveryEstimate = (restaurant?.averagePreparationTime || 22) + 12;

  return (
    <section className="page">
      <div className="container">
        <ErrorMessage message={error} />
        {restaurant && (
          <>
            <div className="card">
              <span className="badge">Kitchen Load: {restaurant.kitchenLoad}</span>
              <span className="badge" style={{ marginLeft: 8 }}>{restaurant.isOpen === false ? "Closed" : "Open now"}</span>
              <h1>{restaurant.name}</h1>
              <p className="muted">{restaurant.description}</p>
              <p><b>Address:</b> {restaurant.address || "Not provided"}</p>
              <p><b>Location:</b> {restaurant.location?.lat || 32.1020}, {restaurant.location?.lng || 74.8740} (Narowal approximate)</p>
              <p><b>Rating:</b> {restaurant.rating || 0} ({restaurant.totalReviews || 0} reviews)</p>
              <p><b>Delivery Estimate:</b> {deliveryEstimate} minutes | <b>Estimated Fee:</b> Rs. 125 | <b>Payment:</b> COD available</p>
              <SmartMap points={[{ label: restaurant.name, lat: restaurant.location?.lat || 32.1020, lng: restaurant.location?.lng || 74.8740 }]} />
            </div>

            <h2 style={{ marginTop: 28 }}>Menu</h2>
            {categories.length > 0 && (
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ marginBottom: 18 }}>
                <option value="">All categories</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            )}
            {visibleItems.length === 0 && <div className="card">No food items found.</div>}
            <div className="grid grid-3">
              {visibleItems.map((item) => (
                <FoodCard key={item._id} item={item} onAdd={handleAdd} />
              ))}
            </div>

            <div className="card form" style={{ marginTop: 18 }}>
              <h3>Ratings & Reviews</h3>
              <form className="form" onSubmit={submitReview}>
                <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}>
                  {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                </select>
                <textarea rows="3" placeholder="Share your experience" value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
                <button className="btn">Submit Review</button>
              </form>
              {reviews.map((review) => (
                <p key={review._id}><b>{review.rating} stars</b> {review.comment || ""}</p>
              ))}
              {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
