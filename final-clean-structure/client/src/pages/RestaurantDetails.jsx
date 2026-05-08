import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import FoodCard from "../components/food/FoodCard.jsx";
import Loading from "../components/common/Loading.jsx";
import ErrorMessage from "../components/common/ErrorMessage.jsx";
import { getRestaurantById, getRestaurantItems, getRestaurantReviews } from "../services/restaurantService.js";
import { createReview } from "../services/reviewService.js";
import { addToCart, cartTotals, getCart } from "../store/cartStore.js";
import { toast } from "../utils/toast.js";
import SmartMap from "../components/map/SmartMap.jsx";

export default function RestaurantDetails() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [category, setCategory] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [cart, setCart] = useState(() => getCart());
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
    setCart(addToCart({ ...item, restaurant: id }));
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
  const restaurantCart = cart.filter((item) => item.restaurant === id);
  const totals = cartTotals(restaurantCart);
  const groupedItems = categories.length
    ? categories.map((itemCategory) => ({
        category: itemCategory,
        items: visibleItems.filter((item) => item.category === itemCategory),
      })).filter((group) => !category || group.category === category)
    : [{ category: "Menu", items: visibleItems }];

  return (
    <section className="page">
      <div className="container">
        <ErrorMessage message={error} />
        {restaurant && (
          <>
            <div className="card restaurant-hero-card">
              <span className="badge">Kitchen Load: {restaurant.kitchenLoad}</span>
              <span className="badge" style={{ marginLeft: 8 }}>{restaurant.isOpen === false ? "Closed" : "Open now"}</span>
              {restaurant.offerText && <span className="badge success" style={{ marginLeft: 8 }}>{restaurant.offerText}</span>}
              <h1>{restaurant.name}</h1>
              <p className="muted">{restaurant.description}</p>
              <p><b>Address:</b> {restaurant.address || "Not provided"}</p>
              <p><b>Rating:</b> {restaurant.rating || 0} ({restaurant.totalReviews || 0} reviews)</p>
              <p><b>Delivery Estimate:</b> {deliveryEstimate} minutes | <b>Estimated Fee:</b> Rs. {restaurant.deliveryFeeBase || 125} | <b>Payment:</b> COD available</p>
              <SmartMap points={[{ label: restaurant.name, lat: restaurant.location?.lat || 32.1020, lng: restaurant.location?.lng || 74.8740 }]} />
            </div>

            <div className="restaurant-menu-layout">
              <div>
                <div className="section-head" style={{ marginTop: 28 }}>
                  <h2>Menu</h2>
                  <span className="muted">{visibleItems.length} available items</span>
                </div>
                {categories.length > 0 && (
                  <div className="category-row sticky-tabs">
                    <button className={`category-pill ${category === "" ? "active" : ""}`} onClick={() => setCategory("")}>All</button>
                    {categories.map((item) => (
                      <button className={`category-pill ${category === item ? "active" : ""}`} key={item} onClick={() => setCategory(item)}>{item}</button>
                    ))}
                  </div>
                )}
                {visibleItems.length === 0 && <div className="card">No food items found.</div>}
                {groupedItems.map((group) => (
                  <div key={group.category} style={{ marginBottom: 22 }}>
                    <h3>{group.category}</h3>
                    <div className="menu-list">
                      {group.items.map((item) => <FoodCard key={item._id} item={item} onAdd={handleAdd} />)}
                    </div>
                  </div>
                ))}
              </div>
              <aside className="sticky-cart-summary">
                <h3>Your order</h3>
                {restaurantCart.length === 0 ? (
                  <p className="muted">Add items from {restaurant.name} to start your basket.</p>
                ) : (
                  <>
                    {restaurantCart.map((item) => (
                      <div className="mini-cart-line" key={item._id}>
                        <span>{item.quantity} x {item.name}</span>
                        <b>Rs. {Number(item.price * item.quantity).toLocaleString("en-PK")}</b>
                      </div>
                    ))}
                    <div className="summary-row total"><span>Total</span><b>Rs. {Number(totals.total).toLocaleString("en-PK")}</b></div>
                    <Link className="btn summary-btn" to="/cart">View cart</Link>
                  </>
                )}
              </aside>
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
