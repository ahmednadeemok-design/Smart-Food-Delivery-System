import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import FoodCard from "../components/food/FoodCard.jsx";
import Loading from "../components/common/Loading.jsx";
import ErrorMessage from "../components/common/ErrorMessage.jsx";
import { getRestaurantById, getRestaurantItems, getRestaurantReviews } from "../services/restaurantService.js";
import { createReview } from "../services/reviewService.js";
import { addToCart, cartTotals, clearCart, getCart, getCartRestaurantId, removeFromCart, updateCartQuantity } from "../store/cartStore.js";
import { toast } from "../utils/toast.js";
import SmartMap from "../components/map/SmartMap.jsx";
import formatCurrency from "../utils/formatCurrency.js";
import ContactActions from "../components/common/ContactActions.jsx";

export default function RestaurantDetails() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [category, setCategory] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [cart, setCart] = useState(() => getCart());
  const [pendingItem, setPendingItem] = useState(null);
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
    const currentRestaurantId = getCartRestaurantId(cart);
    if (currentRestaurantId && String(currentRestaurantId) !== String(id)) {
      setPendingItem(item);
      return;
    }
    setCart(addToCart({ ...item, restaurant: id, restaurantName: restaurant?.name, restaurantDeliveryFee: restaurant?.deliveryFeeBase || 125 }));
    toast.success("Added to cart");
  };

  const clearAndAddPending = () => {
    if (!pendingItem) return;
    clearCart();
    setCart(addToCart({ ...pendingItem, restaurant: id, restaurantName: restaurant?.name, restaurantDeliveryFee: restaurant?.deliveryFeeBase || 125 }));
    setPendingItem(null);
    toast.success("Started a new order");
  };

  const remove = (itemId) => setCart(removeFromCart(itemId));
  const updateQuantity = (itemId, quantity) => setCart(updateCartQuantity(itemId, quantity));

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
  const restaurantCart = cart.filter((item) => String(item.restaurant?._id || item.restaurant) === String(id));
  const totals = cartTotals(restaurantCart, { deliveryFee: restaurant?.deliveryFeeBase || 125 });
  const oldRestaurantName = cart.find((item) => String(item.restaurant) !== String(id))?.restaurantName || "another restaurant";
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
              <ContactActions
                title={restaurant.name}
                subtitle="Restaurant contact"
                phone={restaurant.supportContact || restaurant.phone}
                location={restaurant.location}
                address={restaurant.address}
              />
              <SmartMap points={[{ label: restaurant.name, lat: restaurant.location?.lat || 32.1020, lng: restaurant.location?.lng || 74.8740 }]} />
            </div>

            <div className="restaurant-menu-layout">
              <div>
                <div className="section-head" id="menu" style={{ marginTop: 28 }}>
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
                <p className="muted cart-restaurant-name">{restaurant.name}</p>
                {restaurantCart.length === 0 ? (
                  <div className="cart-empty-mini">
                    <p className="muted">Add items from this menu and your order summary will update instantly.</p>
                    <a className="btn outline summary-btn" href="#menu">Browse menu</a>
                  </div>
                ) : (
                  <>
                    {restaurantCart.map((item) => (
                      <div className="mini-cart-line" key={item._id}>
                        <div>
                          <span>{item.name}</span>
                          <small>{formatCurrency(item.price)} each</small>
                          <div className="quantity-stepper compact">
                            <button type="button" onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                          </div>
                        </div>
                        <div className="mini-cart-price">
                          <b>{formatCurrency(item.price * item.quantity)}</b>
                          <button type="button" className="link-button" onClick={() => remove(item._id)}>Remove</button>
                        </div>
                      </div>
                    ))}
                    <div className="summary-row"><span>Subtotal</span><b>{formatCurrency(totals.subtotal)}</b></div>
                    <div className="summary-row"><span>Delivery fee</span><b>{formatCurrency(totals.deliveryFee)}</b></div>
                    <div className="summary-row"><span>Platform fee</span><b>{formatCurrency(totals.platformFee)}</b></div>
                    <div className="summary-row"><span>Service fee</span><b>{formatCurrency(totals.serviceFee)}</b></div>
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
        {pendingItem && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-order-title">
            <div className="modal-card">
              <h3 id="new-order-title">Start a new order?</h3>
              <p className="muted">Your cart contains items from {oldRestaurantName}. To add items from {restaurant?.name}, clear your current cart first.</p>
              <div className="action-row">
                <button className="btn" type="button" onClick={clearAndAddPending}>Clear cart & add item</button>
                <button className="btn outline" type="button" onClick={() => setPendingItem(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
