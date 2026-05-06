require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const Rider = require("../models/Rider");
const Order = require("../models/Order");
const Complaint = require("../models/Complaint");
const Payment = require("../models/Payment");
const Review = require("../models/Review");
const Subscription = require("../models/Subscription");
const TrustScore = require("../models/TrustScore");
const DeliveryVerification = require("../models/DeliveryVerification");
const AdminAuditLog = require("../models/AdminAuditLog");

// approximate coordinates for demo
const NAROWAL_CENTER = { lat: 32.1020, lng: 74.8740 };

// approximate coordinates for demo
const restaurants = [
  {
    name: "Palmer Restaurant",
    address: "Circular Road, near Narowal City Center",
    localArea: "Circular Road",
    cuisineTypes: ["Desi", "Fast Food", "Family Restaurant"],
    phone: "0542-000001",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=900",
    rating: 4.4,
    kitchenLoad: "medium",
    trustScore: 93,
    accuracyRate: 96,
    isOpen: true,
    location: { lat: 32.1020, lng: 74.8725 },
    items: [
      { name: "Palmer Special Chicken Karahi", price: 1350, category: "Desi", calories: 920, tags: ["desi", "karahi", "family-restaurant", "dinner"] },
      { name: "Zinger Burger Meal", price: 620, category: "Fast Food", calories: 780, tags: ["burger", "fast-food", "zinger"] },
      { name: "Chicken Biryani Plate", price: 380, category: "Rice", calories: 680, tags: ["biryani", "desi", "lunch"] },
    ],
  },
  {
    name: "Buddy's Narowal",
    address: "College Road, Narowal",
    localArea: "College Road",
    cuisineTypes: ["Fast Food", "Pizza", "Burger"],
    phone: "0542-000002",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=900",
    rating: 4.3,
    kitchenLoad: "high",
    trustScore: 90,
    accuracyRate: 94,
    isOpen: true,
    location: { lat: 32.1042, lng: 74.8761 },
    items: [
      { name: "Buddy's Crown Crust Pizza", price: 1850, category: "Pizza", calories: 1180, tags: ["pizza", "fast-food", "family-restaurant"] },
      { name: "Loaded Beef Burger", price: 760, category: "Burger", calories: 850, tags: ["burger", "fast-food"] },
      { name: "Masala Fries", price: 320, category: "Sides", calories: 430, tags: ["fast-food", "snacks"] },
    ],
  },
  {
    name: "The Dining Family Restaurant",
    address: "Zafarwal Road, Narowal",
    localArea: "Zafarwal Road",
    cuisineTypes: ["Family Restaurant", "Desi", "Chinese"],
    phone: "0542-000003",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=900",
    rating: 4.5,
    kitchenLoad: "medium",
    trustScore: 95,
    accuracyRate: 97,
    isOpen: true,
    location: { lat: 32.0975, lng: 74.8842 },
    items: [
      { name: "Family BBQ Platter", price: 2450, category: "BBQ", calories: 1450, tags: ["bbq", "desi", "family-restaurant"] },
      { name: "Chicken Chow Mein", price: 650, category: "Chinese", calories: 620, tags: ["chinese", "noodles"] },
      { name: "Mutton Handi", price: 1750, category: "Desi", calories: 980, tags: ["desi", "handi", "dinner"] },
    ],
  },
  {
    name: "City Restaurant Narowal",
    address: "Main Bazaar, Narowal",
    localArea: "Main Bazaar",
    cuisineTypes: ["Desi", "Biryani", "Tea"],
    phone: "0542-000004",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=900",
    rating: 4.1,
    kitchenLoad: "low",
    trustScore: 88,
    accuracyRate: 91,
    isOpen: true,
    location: { lat: 32.1011, lng: 74.8703 },
    items: [
      { name: "City Chicken Biryani", price: 340, category: "Biryani", calories: 690, tags: ["biryani", "desi", "budget"] },
      { name: "Daal Fry with Roti", price: 260, category: "Desi", calories: 510, tags: ["desi", "vegetarian", "lunch"] },
      { name: "Karak Chai", price: 90, category: "Tea", calories: 120, tags: ["tea", "breakfast"] },
    ],
  },
  {
    name: "Moon Grill Restaurant",
    address: "Railway Road, Narowal",
    localArea: "Railway Road",
    cuisineTypes: ["BBQ", "Grill", "Desi"],
    phone: "0542-000005",
    image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=900",
    rating: 4.2,
    kitchenLoad: "medium",
    trustScore: 91,
    accuracyRate: 93,
    isOpen: true,
    location: { lat: 32.0990, lng: 74.8678 },
    items: [
      { name: "Moon Grill Chicken Tikka", price: 520, category: "BBQ", calories: 480, tags: ["bbq", "grill", "desi"] },
      { name: "Seekh Kabab Roll", price: 360, category: "Rolls", calories: 560, tags: ["bbq", "roll", "fast-food"] },
      { name: "Grilled Fish", price: 1250, category: "Grill", calories: 740, tags: ["grill", "healthy", "dinner"] },
    ],
  },
  {
    name: "Lasani Al Khan Restaurant",
    address: "Shakargarh Road, Narowal",
    localArea: "Shakargarh Road",
    cuisineTypes: ["Desi", "Karahi", "Family Restaurant"],
    phone: "0542-000006",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=900",
    rating: 4.4,
    kitchenLoad: "high",
    trustScore: 92,
    accuracyRate: 95,
    isOpen: true,
    location: { lat: 32.1071, lng: 74.8669 },
    items: [
      { name: "Lasani Mutton Karahi", price: 2100, category: "Karahi", calories: 1100, tags: ["karahi", "desi", "family-restaurant"] },
      { name: "Chicken White Handi", price: 1450, category: "Handi", calories: 980, tags: ["desi", "handi"] },
      { name: "Tandoori Roti", price: 35, category: "Bread", calories: 160, tags: ["desi", "bread"] },
    ],
  },
  {
    name: "Crunch Bite Family Restaurant",
    address: "New Lahore Road, Narowal",
    localArea: "New Lahore Road",
    cuisineTypes: ["Fast Food", "Burger", "Pizza"],
    phone: "0542-000007",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=900",
    rating: 4.0,
    kitchenLoad: "medium",
    trustScore: 86,
    accuracyRate: 89,
    isOpen: true,
    location: { lat: 32.0954, lng: 74.8788 },
    items: [
      { name: "Crunch Bite Zinger", price: 580, category: "Burger", calories: 760, tags: ["burger", "fast-food", "zinger"] },
      { name: "Chicken Fajita Pizza", price: 1550, category: "Pizza", calories: 1050, tags: ["pizza", "fast-food"] },
      { name: "Crispy Broast", price: 720, category: "Chicken", calories: 820, tags: ["fast-food", "broast"] },
    ],
  },
  {
    name: "Anbala Sweets, Bakers and Cash & Carry",
    address: "Main Market, Narowal",
    localArea: "Main Market",
    cuisineTypes: ["Bakery", "Sweets", "Breakfast"],
    phone: "0542-000008",
    image: "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?q=80&w=900",
    rating: 4.6,
    kitchenLoad: "low",
    trustScore: 96,
    accuracyRate: 98,
    isOpen: true,
    location: { lat: 32.1003, lng: 74.8716 },
    items: [
      { name: "Anbala Mix Mithai Box", price: 1150, category: "Sweets", calories: 1450, tags: ["bakery", "sweets", "mithai"] },
      { name: "Chicken Patties", price: 140, category: "Bakery", calories: 310, tags: ["bakery", "snacks"] },
      { name: "Fresh Cream Cake Slice", price: 260, category: "Bakery", calories: 420, tags: ["bakery", "dessert"] },
    ],
  },
  {
    name: "ZFC Narowal",
    address: "Pasrur Road, Narowal",
    localArea: "Pasrur Road",
    cuisineTypes: ["Fast Food", "Fried Chicken", "Burger"],
    phone: "0542-000009",
    image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=900",
    rating: 4.1,
    kitchenLoad: "medium",
    trustScore: 87,
    accuracyRate: 90,
    isOpen: true,
    location: { lat: 32.0928, lng: 74.8695 },
    items: [
      { name: "ZFC Mighty Zinger", price: 650, category: "Burger", calories: 790, tags: ["burger", "fast-food", "zinger"] },
      { name: "Fried Chicken Bucket", price: 1950, category: "Fried Chicken", calories: 1600, tags: ["fast-food", "fried-chicken", "family-restaurant"] },
      { name: "Garlic Mayo Fries", price: 330, category: "Sides", calories: 470, tags: ["fast-food", "fries"] },
    ],
  },
  {
    name: "Virsa Restaurant Narowal",
    address: "Muridke Road link, Narowal",
    localArea: "Muridke Road Link",
    cuisineTypes: ["Desi", "Traditional", "Family Restaurant"],
    phone: "0542-000010",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=900",
    rating: 4.7,
    kitchenLoad: "medium",
    trustScore: 97,
    accuracyRate: 98,
    isOpen: true,
    location: { lat: 32.1085, lng: 74.8801 },
    items: [
      { name: "Virsa Desi Murgh", price: 1850, category: "Traditional", calories: 1040, tags: ["desi", "traditional", "family-restaurant"] },
      { name: "Saag Makai Roti Combo", price: 620, category: "Traditional", calories: 700, tags: ["desi", "vegetarian", "traditional"] },
      { name: "Gur Wali Lassi", price: 220, category: "Drinks", calories: 280, tags: ["desi", "drink", "traditional"] },
    ],
  },
];

const demoUsers = [
  {
    name: "Ayesha Narowal",
    email: "ayesha.customer@smartfood.local",
    phone: "03000000101",
    role: "customer",
    address: "UET Narowal Campus, Hostel Gate, Narowal",
    location: { lat: 32.1135, lng: 74.8734 },
    healthProfile: { caloriesGoal: 1800, dietType: "balanced", allergies: [] },
  },
  {
    name: "Bilal Main Bazaar",
    email: "bilal.customer@smartfood.local",
    phone: "03000000102",
    role: "customer",
    address: "Main Bazaar, near Anbala Sweets, Narowal",
    location: { lat: 32.1008, lng: 74.8712 },
    healthProfile: { caloriesGoal: 2200, dietType: "high-protein", allergies: [] },
  },
  {
    name: "SmartFood Narowal Admin",
    email: "admin.narowal@smartfood.local",
    phone: "03000000103",
    role: "admin",
    address: "SmartFood Operations Desk, Circular Road, Narowal",
    location: NAROWAL_CENTER,
  },
  {
    name: "Rider Ali Railway Road",
    email: "rider.ali@smartfood.local",
    phone: "03000000104",
    role: "rider",
    address: "Railway Road, Narowal",
    location: { lat: 32.0990, lng: 74.8678 },
  },
  {
    name: "Rider Usman UET Zone",
    email: "rider.usman@smartfood.local",
    phone: "03000000105",
    role: "rider",
    address: "UET Narowal Campus, Narowal",
    location: { lat: 32.1135, lng: 74.8734 },
  },
];

const statusLabels = {
  pending: "Order placed",
  accepted: "Restaurant accepted the order",
  preparing: "Kitchen started preparation",
  ready: "Order ready for pickup",
  picked: "Rider picked up the order",
  delivered: "Delivered with OTP",
};

const buildTimeline = (statuses) =>
  statuses.map((status, index) => ({
    status,
    label: statusLabels[status] || status,
    at: new Date(Date.now() - (statuses.length - index) * 12 * 60 * 1000),
  }));

const seed = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing");
  await mongoose.connect(process.env.MONGO_URI);

  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    FoodItem.deleteMany({}),
    Order.deleteMany({}),
    Rider.deleteMany({}),
    Complaint.deleteMany({}),
    Payment.deleteMany({}),
    Subscription.deleteMany({}),
    Review.deleteMany({}),
    TrustScore.deleteMany({}),
    DeliveryVerification.deleteMany({}),
    AdminAuditLog.deleteMany({}),
  ]);

  const owner = await User.create({
    name: "Narowal Demo Restaurant Owner",
    email: "narowal.owner@smartfood.local",
    phone: "03000000001",
    role: "restaurant",
    password: "demo123",
    address: "Circular Road, Narowal",
    location: NAROWAL_CENTER,
  });

  const usersByEmail = {};
  for (const demoUser of demoUsers) {
    const user = await User.create({ ...demoUser, password: "demo123" });
    usersByEmail[demoUser.email] = user;
  }

  const riderAli = await Rider.findOneAndUpdate(
    { user: usersByEmail["rider.ali@smartfood.local"]._id },
    {
      user: usersByEmail["rider.ali@smartfood.local"]._id,
      vehicleType: "bike",
      currentLocation: { lat: 32.0990, lng: 74.8678 },
      isOnline: true,
      approvalStatus: "approved",
      isActive: true,
      isSuspended: false,
      maxBatchOrders: 3,
      workloadScore: 35,
      trustScore: 94,
      completedDeliveries: 138,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const riderUsman = await Rider.findOneAndUpdate(
    { user: usersByEmail["rider.usman@smartfood.local"]._id },
    {
      user: usersByEmail["rider.usman@smartfood.local"]._id,
      vehicleType: "bike",
      currentLocation: { lat: 32.1135, lng: 74.8734 },
      isOnline: true,
      approvalStatus: "approved",
      isActive: true,
      isSuspended: false,
      maxBatchOrders: 2,
      workloadScore: 20,
      trustScore: 91,
      completedDeliveries: 96,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  let restaurantCount = 0;
  let itemCount = 0;
  const restaurantsByName = {};
  const itemsByRestaurant = {};

  for (const entry of restaurants) {
    const restaurant = await Restaurant.create({
        owner: owner._id,
        name: entry.name,
        description: `${entry.cuisineTypes.join(", ")} delivery in ${entry.localArea}, Narowal.`,
        phone: entry.phone,
        address: entry.address,
        localArea: entry.localArea,
        location: entry.location || NAROWAL_CENTER,
        image: entry.image,
        cuisineTypes: entry.cuisineTypes,
        isOpen: entry.isOpen,
        approvalStatus: "approved",
        isActive: true,
        qualityFlag: false,
        kitchenLoad: entry.kitchenLoad,
        averagePreparationTime: entry.kitchenLoad === "high" ? 28 : entry.kitchenLoad === "medium" ? 22 : 16,
        accuracyRate: entry.accuracyRate,
        trustScore: entry.trustScore,
        rating: entry.rating,
        totalReviews: Math.floor(entry.rating * 10),
      });
    restaurantsByName[entry.name] = restaurant;
    restaurantCount += 1;
    itemsByRestaurant[entry.name] = [];

    for (const item of entry.items) {
      const foodItem = await FoodItem.create({
          restaurant: restaurant._id,
          name: item.name,
          description: `${item.name} from ${entry.name}, prepared for Narowal delivery.`,
          price: item.price,
          image: entry.image,
          category: item.category,
          calories: item.calories,
          tags: item.tags,
          isAvailable: true,
          tasteScore: Math.min(100, Math.round(entry.rating * 20)),
          complaintCount: 0,
        });
      itemsByRestaurant[entry.name].push(foodItem);
      itemCount += 1;
    }
  }

  const demoOrders = [
    {
      key: "narowal-demo-order-uet-palmer",
      customer: usersByEmail["ayesha.customer@smartfood.local"],
      restaurant: restaurantsByName["Palmer Restaurant"],
      rider: riderUsman,
      sourceItems: itemsByRestaurant["Palmer Restaurant"].slice(0, 2),
      deliveryAddress: "UET Narowal Campus, Girls Hostel Gate, Narowal",
      deliveryLocation: { lat: 32.1135, lng: 74.8734 },
      status: "preparing",
      timeline: ["pending", "accepted", "preparing"],
      distanceKm: 3.8,
      complaint: null,
    },
    {
      key: "narowal-demo-order-mainbazaar-anbala",
      customer: usersByEmail["bilal.customer@smartfood.local"],
      restaurant: restaurantsByName["Anbala Sweets, Bakers and Cash & Carry"],
      rider: riderAli,
      sourceItems: itemsByRestaurant["Anbala Sweets, Bakers and Cash & Carry"].slice(0, 2),
      deliveryAddress: "Main Bazaar, opposite Narowal Clock Market",
      deliveryLocation: { lat: 32.1008, lng: 74.8712 },
      status: "delivered",
      timeline: ["pending", "accepted", "preparing", "ready", "picked", "delivered"],
      distanceKm: 1.5,
      complaint: {
        type: "late_delivery",
        description: "Cake slice reached late near Main Bazaar during evening rush.",
        aiDecision: "partial_refund",
        compensation: 120,
        status: "reviewing",
      },
    },
    {
      key: "narowal-demo-order-zfc-railway",
      customer: usersByEmail["ayesha.customer@smartfood.local"],
      restaurant: restaurantsByName["ZFC Narowal"],
      rider: null,
      sourceItems: itemsByRestaurant["ZFC Narowal"].slice(0, 2),
      deliveryAddress: "Narowal Railway Station, main entrance",
      deliveryLocation: { lat: 32.0992, lng: 74.8669 },
      status: "ready",
      timeline: ["pending", "accepted", "preparing", "ready"],
      distanceKm: 2.4,
      complaint: null,
    },
  ];

  let orderCount = 0;
  let complaintCount = 0;
  for (const demoOrder of demoOrders) {
    const orderItems = demoOrder.sourceItems.map((item, index) => ({
      foodItem: item._id,
      name: item.name,
      price: item.price,
      quantity: index === 0 ? 1 : 2,
      calories: item.calories,
    }));
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = Math.round(70 + demoOrder.distanceKm * 18);
    const platformFee = Math.max(25, Math.round(subtotal * 0.03));
    const serviceFee = 15;
    const totalAmount = subtotal + deliveryFee + platformFee + serviceFee;

    const order = await Order.create({
        customer: demoOrder.customer._id,
        restaurant: demoOrder.restaurant._id,
        rider: demoOrder.rider?._id,
        items: orderItems,
        deliveryAddress: demoOrder.deliveryAddress,
        deliveryLocation: demoOrder.deliveryLocation,
        status: demoOrder.status,
        paymentMethod: "cod",
        paymentStatus: demoOrder.status === "delivered" ? "paid" : "pending",
        subtotal,
        deliveryFee,
        platformFee,
        serviceFee,
        totalAmount,
        otp: "123456",
        emergencyMode: false,
        freshnessScore: demoOrder.status === "delivered" ? 82 : 96,
        estimatedDeliveryTime: demoOrder.status === "ready" ? 22 : 35,
        statusTimeline: [
          { status: "seed", label: demoOrder.key, at: new Date(Date.now() - 2 * 60 * 60 * 1000) },
          ...buildTimeline(demoOrder.timeline),
        ],
        deliveredAt: demoOrder.status === "delivered" ? new Date(Date.now() - 20 * 60 * 1000) : undefined,
      });
    orderCount += 1;

    await Payment.create({
        order: order._id,
        user: demoOrder.customer._id,
        amount: totalAmount,
        method: "cod",
        status: demoOrder.status === "delivered" ? "paid" : "pending",
        transactionId: `COD-${String(order._id).slice(-6).toUpperCase()}`,
      });

    if (demoOrder.rider && !demoOrder.rider.activeOrders.some((id) => String(id) === String(order._id)) && demoOrder.status !== "delivered") {
      demoOrder.rider.activeOrders.push(order._id);
      await demoOrder.rider.save();
    }

    await Review.create({
        order: order._id,
        user: demoOrder.customer._id,
        restaurant: demoOrder.restaurant._id,
        rating: demoOrder.status === "delivered" ? 4 : 5,
        comment: `${demoOrder.restaurant.name} demo review for Narowal delivery operations.`,
        sentiment: "positive",
      });

    if (demoOrder.complaint) {
      await Complaint.create({
          order: order._id,
          customer: demoOrder.customer._id,
          ...demoOrder.complaint,
        });
      complaintCount += 1;
    }
  }

  console.log(
    `Narowal clean seed completed: reset target collections and inserted 1 owner, ${restaurantCount} restaurants, ${itemCount} menu items, ${demoUsers.length} users, 2 riders, ${orderCount} orders, and ${complaintCount} complaints.`
  );
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(`Narowal seed failed: ${error.message}`);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
