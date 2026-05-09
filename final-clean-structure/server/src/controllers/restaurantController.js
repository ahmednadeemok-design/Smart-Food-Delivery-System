const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const Order = require("../models/Order");
const Campaign = require("../models/Campaign");
const SupportTicket = require("../models/SupportTicket");
const { emitAdminRealtime, emitRestaurantRealtime } = require("../services/realtimeService");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { NAROWAL_AREAS, NAROWAL_CENTER, clampLocation, resolveNarowalArea } = require("../constants/narowal");
const { fallbackMenu, fallbackRestaurants, getFallbackRestaurants } = require("../data/narowalFallbackData");
const {
  ACTIVE_ORDER_STATUSES,
  TERMINAL_ORDER_STATUSES,
  applyArchiveWindow,
  buildOrderScopeQuery,
  paginationFromQuery,
} = require("../services/orderLifecycleService");

const restaurantPopulate = [
  { path: "customer", select: "name email phone" },
  { path: "restaurant", select: "name address phone localArea location averagePreparationTime isOpen approvalStatus" },
  { path: "rider", populate: { path: "user", select: "name email phone" } },
];

const getOwnedRestaurant = async (userId) => Restaurant.findOne({ owner: userId }).sort("-createdAt");

const orderQueryForOwner = async (userId) => {
  const restaurants = await Restaurant.find({ owner: userId }).select("_id");
  return restaurants.length ? { restaurant: { $in: restaurants.map((restaurant) => restaurant._id) } } : { _id: null };
};

const isActiveCampaign = (campaign) => {
  const now = Date.now();
  const startsOk = !campaign.startDate || new Date(campaign.startDate).getTime() <= now;
  const endsOk = !campaign.endDate || new Date(campaign.endDate).getTime() >= now;
  return campaign.isActive && startsOk && endsOk;
};

const calculateDashboard = async (restaurant) => {
  if (!restaurant) return null;
  const [orders, items, tickets, campaigns] = await Promise.all([
    Order.find({ restaurant: restaurant._id }).populate(restaurantPopulate).sort("-createdAt").limit(100),
    FoodItem.find({ restaurant: restaurant._id }).sort("category name"),
    SupportTicket.find({ restaurant: restaurant._id }).sort("-createdAt").limit(20),
    Campaign.find({ restaurant: restaurant._id }).sort("-createdAt"),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);
  const completed = orders.filter((order) => order.status === "delivered");
  const todayCompleted = completed.filter((order) => new Date(order.deliveredAt || order.updatedAt) >= todayStart);
  const weeklyCompleted = completed.filter((order) => new Date(order.deliveredAt || order.updatedAt) >= weekStart);
  const activeOrders = orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status));
  const acceptedLike = orders.filter((order) => ["accepted", "preparing", "ready", "assigned", "picked", "delivered"].includes(order.status)).length;
  const accuracyRate = orders.length ? Math.round((acceptedLike / orders.length) * 100) : restaurant.accuracyRate || 100;

  return {
    restaurant,
    orders: activeOrders,
    items,
    supportTickets: tickets,
    campaigns,
    stats: {
      activeOrders: activeOrders.length,
      pendingOrders: orders.filter((order) => order.status === "pending").length,
      preparingOrders: orders.filter((order) => order.status === "preparing").length,
      readyOrders: orders.filter((order) => order.status === "ready").length,
      todaySales: todayCompleted.reduce((sum, order) => sum + Number(order.restaurantRevenue || order.totalAmount || 0), 0),
      weeklySales: weeklyCompleted.reduce((sum, order) => sum + Number(order.restaurantRevenue || order.totalAmount || 0), 0),
      completedOrders: completed.length,
      rejectedOrders: orders.filter((order) => order.status === "rejected").length,
      cancelledOrders: orders.filter((order) => order.status === "cancelled").length,
      averageOrderValue: completed.length ? Math.round(completed.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0) / completed.length) : 0,
      accuracyRate,
      trustScore: restaurant.trustScore || 100,
      averagePreparationTime: restaurant.averagePreparationTime || 20,
      supportIssues: tickets.filter((ticket) => ticket.status !== "resolved").length,
      activeCampaigns: campaigns.filter(isActiveCampaign).length,
      topItems: items.slice().sort((a, b) => Number(b.soldCount || 0) - Number(a.soldCount || 0)).slice(0, 5),
    },
  };
};

const restaurantPayload = (body) => {
  const localArea = body.localArea || resolveNarowalArea(body.address);
  const payload = { ...body };
  if (localArea) payload.localArea = localArea;
  if (body.location) payload.location = clampLocation(body.location);
  if (body.businessHours) {
    payload.businessHours = {
      opensAt: body.businessHours.opensAt || body.opensAt || "11:00",
      closesAt: body.businessHours.closesAt || body.closesAt || "23:30",
    };
  } else if (body.opensAt || body.closesAt) {
    payload.businessHours = {
      opensAt: body.opensAt || "11:00",
      closesAt: body.closesAt || "23:30",
    };
  }
  return payload;
};

exports.createRestaurant = async (req, res) => {
  try {
    if (!req.body.name) return errorResponse(res, "Restaurant name is required", 400);
    const localArea = req.body.localArea || resolveNarowalArea(req.body.address);
    if (!NAROWAL_AREAS.includes(localArea)) return errorResponse(res, "Restaurant must be in a supported Narowal area", 400);
    const restaurant = await Restaurant.create({ ...restaurantPayload(req.body), owner: req.user._id, approvalStatus: req.body.approvalStatus || "pending_review" });
    return successResponse(res, "Restaurant created successfully", restaurant, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getMyRestaurants = async (req, res) => {
  const restaurants = await Restaurant.find({ owner: req.user._id }).sort("-createdAt");
  return successResponse(res, "Owner restaurants fetched successfully", restaurants);
};

exports.getMyRestaurantOrders = async (req, res) => {
  const ownerQuery = await orderQueryForOwner(req.user._id);
  await applyArchiveWindow(Order, ownerQuery);
  const view = req.query.view || "active";
  const scopedQuery = { ...ownerQuery, ...buildOrderScopeQuery({ view, status: req.query.status, search: req.query.q }) };
  const { page, limit, skip } = paginationFromQuery(req.query);
  const [orders, total] = await Promise.all([
    Order.find(scopedQuery)
      .populate(restaurantPopulate)
      .sort(view === "active" ? { emergencyMode: -1, createdAt: -1 } : { updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(scopedQuery),
  ]);
  return successResponse(res, "Restaurant orders fetched successfully", {
    orders,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    filters: { view, activeStatuses: ACTIVE_ORDER_STATUSES, historyStatuses: TERMINAL_ORDER_STATUSES },
  });
};

exports.getMyRestaurantDashboard = async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id);
  if (!restaurant) {
    return successResponse(res, "Restaurant onboarding required", {
      onboardingRequired: true,
      approvalStatus: "missing",
      restaurant: null,
      stats: {},
      orders: [],
      items: [],
      campaigns: [],
      supportTickets: [],
    });
  }
  const dashboard = await calculateDashboard(restaurant);
  return successResponse(res, "Restaurant dashboard fetched", dashboard);
};

exports.updateMyRestaurantOpenStatus = async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id);
  if (!restaurant) return errorResponse(res, "Create your restaurant profile before changing open status", 404);
  if (restaurant.approvalStatus !== "approved" && req.body.isOpen !== false) {
    return errorResponse(res, "Restaurant must be approved before it can accept live orders", 403);
  }
  if (restaurant.approvalStatus === "suspended") return errorResponse(res, "Suspended restaurants cannot go online", 403);
  restaurant.isOpen = Boolean(req.body.isOpen);
  await restaurant.save();
  return successResponse(res, restaurant.isOpen ? "Restaurant opened for Narowal orders" : "Restaurant closed", restaurant);
};

exports.updateMyBusinessHours = async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id);
  if (!restaurant) return errorResponse(res, "Restaurant profile not found", 404);
  restaurant.businessHours = {
    opensAt: req.body.opensAt || req.body.businessHours?.opensAt || restaurant.businessHours?.opensAt || "11:00",
    closesAt: req.body.closesAt || req.body.businessHours?.closesAt || restaurant.businessHours?.closesAt || "23:30",
  };
  await restaurant.save();
  return successResponse(res, "Business hours updated", restaurant);
};

exports.getMyRestaurantOrderById = async (req, res) => {
  const query = await orderQueryForOwner(req.user._id);
  const order = await Order.findOne({ ...query, _id: req.params.orderId }).populate(restaurantPopulate);
  if (!order) return errorResponse(res, "Order not found for your restaurant", 404);
  return successResponse(res, "Restaurant order fetched", order);
};

exports.updateMyRestaurantOrderStatus = async (req, res) => {
  req.params.id = req.params.orderId;
  return require("./orderController").updateOrderStatus(req, res);
};

exports.getMyRestaurantReports = async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id);
  if (!restaurant) return errorResponse(res, "Restaurant profile not found", 404);
  const { orders, items, supportTickets, stats } = await calculateDashboard(restaurant);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const delivered = orders.filter((order) => order.status === "delivered");
  const monthlyDelivered = delivered.filter((order) => new Date(order.deliveredAt || order.updatedAt) >= monthStart);
  const peakHours = delivered.reduce((acc, order) => {
    const hour = new Date(order.createdAt).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
  const peakOrderHours = Object.entries(peakHours)
    .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return successResponse(res, "Restaurant reports fetched", {
    restaurant,
    metrics: {
      ...stats,
      monthlyRevenue: monthlyDelivered.reduce((sum, order) => sum + Number(order.restaurantRevenue || order.totalAmount || 0), 0),
      complaintCount: supportTickets.length,
      peakOrderHours,
      popularItems: items.slice().sort((a, b) => Number(b.soldCount || 0) - Number(a.soldCount || 0)).slice(0, 8),
    },
  });
};

exports.updateMyRestaurant = async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id }).sort("-createdAt");
  if (!restaurant) return errorResponse(res, "Restaurant profile not found", 404);
  req.params.id = restaurant._id;
  return exports.updateRestaurant(req, res);
};

exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return errorResponse(res, "Restaurant not found", 404);
    if (req.user.role !== "admin" && String(restaurant.owner) !== String(req.user._id)) {
      return errorResponse(res, "Not allowed to update this restaurant", 403);
    }

    const localArea = req.body.localArea || (req.body.address ? resolveNarowalArea(req.body.address) : restaurant.localArea);
    if (localArea && !NAROWAL_AREAS.includes(localArea)) return errorResponse(res, "Restaurant must stay inside Narowal coverage", 400);
    Object.assign(restaurant, restaurantPayload(req.body));
    await restaurant.save();
    emitRestaurantRealtime(req, "restaurant:state-updated", restaurant);
    return successResponse(res, "Restaurant updated successfully", restaurant);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getRestaurants = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return successResponse(res, "Restaurants loaded from Narowal offline fallback while MongoDB reconnects", getFallbackRestaurants(req.query));
  }
  const query = req.user?.role === "admin" ? {} : { isActive: { $ne: false }, isOpen: { $ne: false }, $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }] };
  if (req.query.area && !NAROWAL_AREAS.includes(req.query.area)) return errorResponse(res, "Unsupported Narowal area", 400);
  if (req.query.area) query.localArea = req.query.area;
  if (req.query.cuisine) query.cuisineTypes = req.query.cuisine;
  if (req.query.q) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { name: new RegExp(req.query.q, "i") },
        { description: new RegExp(req.query.q, "i") },
        { address: new RegExp(req.query.q, "i") },
      ],
    });
  }
  const restaurants = await Restaurant.find(query).sort({ isFeatured: -1, rating: -1, createdAt: -1 });
  return successResponse(res, "Restaurants fetched successfully", restaurants);
};

exports.getRestaurantById = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const restaurant = fallbackRestaurants.find((item) => String(item._id) === String(req.params.id));
    if (!restaurant) return errorResponse(res, "Restaurant not found while MongoDB reconnects", 404);
    return successResponse(res, "Restaurant loaded from Narowal offline fallback while MongoDB reconnects", restaurant);
  }
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return errorResponse(res, "Restaurant not found", 404);
  return successResponse(res, "Restaurant fetched successfully", restaurant);
};

exports.addFoodItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) return errorResponse(res, "Restaurant not found", 404);
    if (req.user.role !== "admin" && String(restaurant.owner) !== String(req.user._id)) {
      return errorResponse(res, "Not allowed to manage this restaurant", 403);
    }

    const item = await FoodItem.create({ ...req.body, restaurant: req.params.restaurantId });
    return successResponse(res, "Food item added successfully", item, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.addMyFoodItem = async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id);
  if (!restaurant) return errorResponse(res, "Create a restaurant profile before adding menu items", 404);
  req.params.restaurantId = restaurant._id;
  return exports.addFoodItem(req, res);
};

exports.getFoodItems = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const restaurantId = req.params.restaurantId || req.params.id;
    return successResponse(res, "Menu loaded from Narowal offline fallback while MongoDB reconnects", fallbackMenu[restaurantId] || []);
  }
  const query = { restaurant: req.params.restaurantId || req.params.id };
  if (req.user?.role !== "admin" && req.user?.role !== "restaurant") {
    query.isAvailable = { $ne: false };
    query.isOutOfStock = { $ne: true };
  }
  const items = await FoodItem.find(query).sort("category name");
  return successResponse(res, "Food items fetched successfully", items);
};

exports.updateMyFoodItem = async (req, res) => {
  req.params.itemId = req.params.itemId;
  return exports.updateFoodItem(req, res);
};

exports.updateMyFoodItemAvailability = async (req, res) => {
  const item = await FoodItem.findById(req.params.itemId);
  if (!item) return errorResponse(res, "Food item not found", 404);
  const restaurant = await Restaurant.findOne({ _id: item.restaurant, owner: req.user._id });
  if (!restaurant) return errorResponse(res, "Not allowed to manage this menu item", 403);
  if (req.body.isAvailable !== undefined) item.isAvailable = Boolean(req.body.isAvailable);
  if (req.body.isOutOfStock !== undefined) item.isOutOfStock = Boolean(req.body.isOutOfStock);
  await item.save();
  emitRestaurantRealtime(req, "restaurant:menu-updated", restaurant, { item });
  return successResponse(res, "Menu availability updated", item);
};

exports.updateFoodItem = async (req, res) => {
  try {
    const item = await FoodItem.findById(req.params.itemId);
    if (!item) return errorResponse(res, "Food item not found", 404);

    const restaurant = await Restaurant.findById(item.restaurant);
    if (req.user.role !== "admin" && String(restaurant.owner) !== String(req.user._id)) {
      return errorResponse(res, "Not allowed to manage this food item", 403);
    }

    Object.assign(item, req.body);
    await item.save();
    return successResponse(res, "Food item updated successfully", item);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.deleteFoodItem = async (req, res) => {
  try {
    const item = await FoodItem.findById(req.params.itemId);
    if (!item) return errorResponse(res, "Food item not found", 404);

    const restaurant = await Restaurant.findById(item.restaurant);
    if (req.user.role !== "admin" && String(restaurant.owner) !== String(req.user._id)) {
      return errorResponse(res, "Not allowed to manage this food item", 403);
    }

    await item.deleteOne();
    return successResponse(res, "Food item deleted successfully", { id: req.params.itemId });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getMyCampaigns = async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id);
  if (!restaurant) return errorResponse(res, "Restaurant profile not found", 404);
  const campaigns = await Campaign.find({ restaurant: restaurant._id }).sort("-createdAt");
  return successResponse(res, "Campaigns fetched", campaigns);
};

exports.createMyCampaign = async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id);
  if (!restaurant) return errorResponse(res, "Restaurant profile not found", 404);
  if (!req.body.title) return errorResponse(res, "Campaign title is required", 400);
  const campaign = await Campaign.create({ ...req.body, restaurant: restaurant._id });
  return successResponse(res, "Campaign created", campaign, 201);
};

exports.updateMyCampaign = async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id);
  if (!restaurant) return errorResponse(res, "Restaurant profile not found", 404);
  const campaign = await Campaign.findOneAndUpdate(
    { _id: req.params.id, restaurant: restaurant._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!campaign) return errorResponse(res, "Campaign not found", 404);
  return successResponse(res, "Campaign updated", campaign);
};

exports.deleteMyCampaign = async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id);
  if (!restaurant) return errorResponse(res, "Restaurant profile not found", 404);
  const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, restaurant: restaurant._id });
  if (!campaign) return errorResponse(res, "Campaign not found", 404);
  return successResponse(res, "Campaign deleted", { id: req.params.id });
};

exports.getMySupportTickets = async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id);
  if (!restaurant) return errorResponse(res, "Restaurant profile not found", 404);
  const tickets = await SupportTicket.find({ restaurant: restaurant._id }).populate("order", "status totalAmount").sort("-createdAt");
  return successResponse(res, "Support tickets fetched", tickets);
};

exports.createMySupportTicket = async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id);
  if (!restaurant) return errorResponse(res, "Restaurant profile not found", 404);
  if (!req.body.description) return errorResponse(res, "Support ticket description is required", 400);
  const ticket = await SupportTicket.create({
    restaurant: restaurant._id,
    owner: req.user._id,
    order: req.body.order || undefined,
    type: req.body.type || "technical_issue",
    description: req.body.description,
  });
  restaurant.supportTicketCount = Number(restaurant.supportTicketCount || 0) + 1;
  await restaurant.save();
  emitRestaurantRealtime(req, "restaurant:support-notification", restaurant, { ticket });
  emitAdminRealtime(req, "admin:support-ticket-updated", { ticket });
  return successResponse(res, "Support ticket created", ticket, 201);
};

exports.updateMySupportTicket = async (req, res) => {
  const restaurant = await getOwnedRestaurant(req.user._id);
  if (!restaurant) return errorResponse(res, "Restaurant profile not found", 404);
  const ticket = await SupportTicket.findOneAndUpdate(
    { _id: req.params.id, restaurant: restaurant._id },
    { ownerNote: req.body.ownerNote },
    { new: true, runValidators: true }
  );
  if (!ticket) return errorResponse(res, "Support ticket not found", 404);
  return successResponse(res, "Support ticket updated", ticket);
};
