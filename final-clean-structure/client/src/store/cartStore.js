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
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const existing = cart.find((x) => x._id === item._id);
  if (existing) existing.quantity += quantity;
  else cart.push({ ...item, quantity });
  saveCart(cart);
  return cart;
};

export const removeFromCart = (id) => {
  const cart = getCart().filter((x) => x._id !== id);
  saveCart(cart);
  return cart;
};

export const updateCartQuantity = (id, quantity) => {
  const nextQuantity = Number(quantity) || 0;
  const cart = getCart()
    .map((item) => item._id === id ? { ...item, quantity: nextQuantity } : item)
    .filter((item) => item.quantity > 0);
  saveCart(cart);
  return cart;
};

export const clearCart = () => saveCart([]);

export const cartTotals = (cart) => {
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  const calories = cart.reduce((sum, item) => sum + Number(item.calories || 0) * item.quantity, 0);
  const deliveryFee = cart.length ? 125 : 0;
  const platformFee = cart.length ? Math.max(25, Math.round(subtotal * 0.03)) : 0;
  const serviceFee = cart.length ? 15 : 0;
  return { subtotal, calories, deliveryFee, platformFee, serviceFee, total: subtotal + deliveryFee + platformFee + serviceFee };
};
