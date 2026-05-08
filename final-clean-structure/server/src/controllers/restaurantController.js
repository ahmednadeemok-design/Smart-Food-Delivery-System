const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const Order = require("../models/Order");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { NAROWAL_AREAS, NAROWAL_CENTER, clampLocation, resolveNarowalArea } = require("../constants/narowal");

const restaurantPayload = (body) => {
  const localArea = body.localArea || resolveNarowalArea(body.address);
  const payload = { ...body };
  if (localArea) payload.localArea = localArea;
  if (body.location) payload.location = clampLocation(body.location);
  return payload;
};

exports.createRestaurant = async (req, res) => {
  try {
    if (!req.body.name) return errorResponse(res, "Restaurant name is required", 400);
    const localArea = req.body.localArea || resolveNarowalArea(req.body.address);
    if (!NAROWAL_AREAS.includes(localArea)) return errorResponse(res, "Restaurant must be in a supported Narowal area", 400);
    const restaurant = await Restaurant.create({ ...restaurantPayload(req.body), owner: req.user._id });
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
  const restaurants = await Restaurant.find({ owner: req.user._id }).select("_id");
  const restaurantIds = restaurants.map((restaurant) => restaurant._id);
  const orders = await Order.find(restaurantIds.length ? { restaurant: { $in: restaurantIds } } : { _id: null })
    .populate("customer", "name email phone")
    .populate("restaurant", "name address location localArea")
    .populate({ path: "rider", populate: { path: "user", select: "name phone email" } })
    .sort("-createdAt");
  return successResponse(res, "Restaurant orders fetched successfully", orders);
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
    return successResponse(res, "Restaurant updated successfully", restaurant);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getRestaurants = async (req, res) => {
  const query = req.user?.role === "admin" ? {} : { isActive: { $ne: false }, $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }] };
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

exports.getFoodItems = async (req, res) => {
  const items = await FoodItem.find({ restaurant: req.params.restaurantId });
  return successResponse(res, "Food items fetched successfully", items);
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
