require("dotenv").config();

const API_BASE = process.env.SMOKE_API_BASE || "http://localhost:5000/api";
const PASSWORD = process.env.SMOKE_PASSWORD || "password123";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${body.message || response.statusText}`);
  }
  return body.data;
};

const login = async (email) => {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  return data.token;
};

const main = async () => {
  const ownerEmail = `qa.restaurant.${Date.now()}@smartfood.test`;
  const owner = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "QA Restaurant Owner",
      email: ownerEmail,
      phone: "+923001239999",
      password: PASSWORD,
      role: "restaurant",
      address: "Main Bazaar, Narowal",
      location: { lat: 32.1008, lng: 74.8712 },
    }),
  });
  const ownerToken = owner.token;
  const qaRestaurant = await request("/restaurants", {
    method: "POST",
    token: ownerToken,
    body: JSON.stringify({
      name: `QA Kitchen ${Date.now()}`,
      phone: "+923001239998",
      address: "Main Bazaar, Narowal",
      localArea: "Main Bazaar",
      location: { lat: 32.1008, lng: 74.8712 },
      cuisineTypes: ["Fast Food"],
      businessHours: { opensAt: "11:00", closesAt: "23:00" },
      ownerCnic: "35401-0000000-1",
      businessProof: "QA business proof",
      bankAccountType: "JazzCash",
      bankAccountNumber: "+923001239998",
      deliveryPreference: "platform_riders",
    }),
  });
  await request(`/restaurants/${qaRestaurant._id}/items`, {
    method: "POST",
    token: ownerToken,
    body: JSON.stringify({
      name: "QA Zinger Meal",
      price: 499,
      category: "Burger",
      calories: 650,
      tags: ["fast-food", "burger"],
      isAvailable: true,
    }),
  });
  const adminTokenForApproval = await login("admin@smartfood.test");
  await request(`/admin/restaurants/${qaRestaurant._id}`, {
    method: "PATCH",
    token: adminTokenForApproval,
    body: JSON.stringify({ approvalStatus: "approved", isActive: true, isOpen: true, reason: "Smoke approval" }),
  });

  const customerToken = await login("customer@smartfood.test");
  const qaVisible = await request(`/restaurants?q=${encodeURIComponent(qaRestaurant.name)}`, { token: customerToken });
  if (!qaVisible.some((restaurant) => String(restaurant._id) === String(qaRestaurant._id))) {
    throw new Error("Newly onboarded approved restaurant did not appear to customer.");
  }

  const restaurants = await request("/restaurants?q=ZFC", { token: customerToken });
  const zfc = restaurants.find((restaurant) => restaurant.name === "ZFC Narowal");
  if (!zfc) throw new Error("ZFC Narowal not found. Run npm run seed:narowal first.");

  const menu = await request(`/restaurants/${zfc._id}/items`, { token: customerToken });
  const item = menu[0];
  if (!item) throw new Error("ZFC menu is empty.");

  const order = await request("/orders", {
    method: "POST",
    token: customerToken,
    body: JSON.stringify({
      restaurant: zfc._id,
      items: [{ foodItem: item._id, quantity: 1 }],
      deliveryAddress: "UET Narowal Campus, Main Gate, Narowal",
      deliveryLocation: { lat: 32.1135, lng: 74.8734 },
      paymentMethod: "cod",
    }),
  });

  const restaurantToken = await login("zfc@smartfood.test");
  for (const status of ["accepted", "preparing", "ready"]) {
    await request(`/orders/${order._id}/restaurant-status`, {
      method: "PATCH",
      token: restaurantToken,
      body: JSON.stringify({ status }),
    });
  }

  const riderToken = await login("rider@smartfood.test");
  await request("/riders/availability", {
    method: "PATCH",
    token: riderToken,
    body: JSON.stringify({ isOnline: true, currentLocation: { lat: 32.1020, lng: 74.8740 } }),
  });
  const available = await request("/riders/available-orders", { token: riderToken });
  if (!available.some((availableOrder) => String(availableOrder._id) === String(order._id))) {
    throw new Error("Ready order did not appear for rider.");
  }

  const assigned = await request(`/riders/orders/${order._id}/accept`, { method: "POST", token: riderToken });
  const picked = await request(`/riders/orders/${order._id}/status`, {
    method: "PATCH",
    token: riderToken,
    body: JSON.stringify({ status: "picked" }),
  });

  const customerOrders = await request("/orders/my", { token: customerToken });
  const customerOrder = customerOrders.find((candidate) => String(candidate._id) === String(order._id));
  const delivered = await request(`/riders/orders/${order._id}/verify-otp`, {
    method: "POST",
    token: riderToken,
    body: JSON.stringify({ otp: customerOrder.otp }),
  });

  const adminToken = await login("admin@smartfood.test");
  const adminOrders = await request("/admin/orders", { token: adminToken });
  const adminOrder = adminOrders.find((candidate) => String(candidate._id) === String(order._id));
  const finance = await request("/admin/finance/summary", { token: adminToken });
  const riderProfile = await request("/riders/me", { token: riderToken });
  if (!delivered.riderEarning || !delivered.restaurantRevenue || !delivered.platformCommission) {
    throw new Error("Delivered order is missing financial settlement fields.");
  }
  if (!riderProfile.rider?.pendingPayout) {
    throw new Error("Rider pending payout did not update.");
  }

  console.log(JSON.stringify({
    created: order.status,
    assigned: assigned.status,
    picked: picked.status,
    delivered: delivered.status,
    adminStatus: adminOrder?.status,
    onboardingVisible: true,
    paymentStatus: delivered.paymentStatus,
    riderEarning: delivered.riderEarning,
    restaurantRevenue: delivered.restaurantRevenue,
    platformCommission: delivered.platformCommission,
    pendingRiderPayout: riderProfile.rider.pendingPayout,
    platformEarnings: finance.totals.platformEarnings,
  }, null, 2));
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
