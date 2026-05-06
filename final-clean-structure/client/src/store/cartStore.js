const CART_KEY = "smart_food_cart";

export const getCart = () => {
  const saved = localStorage.getItem(CART_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const addToCart = (item) => {
  const cart = getCart();
  const existing = cart.find((x) => x._id === item._id);
  if (existing) existing.quantity += 1;
  else cart.push({ ...item, quantity: 1 });
  saveCart(cart);
  return cart;
};

export const removeFromCart = (id) => {
  const cart = getCart().filter((x) => x._id !== id);
  saveCart(cart);
  return cart;
};

export const clearCart = () => saveCart([]);

export const cartTotals = (cart) => {
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  const calories = cart.reduce((sum, item) => sum + Number(item.calories || 0) * item.quantity, 0);
  return { subtotal, calories };
};
