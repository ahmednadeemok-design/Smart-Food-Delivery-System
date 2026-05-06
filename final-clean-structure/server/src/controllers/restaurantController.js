const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const { successResponse, errorResponse } = require("../utils/apiResponse");

exports.createRestaurant = async (req, res) => {
  try {
    if (!req.body.name) return errorResponse(res, "Restaurant name is required", 400);
    const restaurant = await Restaurant.create({ ...req.body, owner: req.user._id });
    return successResponse(res, "Restaurant created successfully", restaurant, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getMyRestaurants = async (req, res) => {
  const restaurants = await Restaurant.find({ owner: req.user._id }).sort("-createdAt");
  return successResponse(res, "Owner restaurants fetched successfully", restaurants);
};

exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return errorResponse(res, "Restaurant not found", 404);
    if (req.user.role !== "admin" && String(restaurant.owner) !== String(req.user._id)) {
      return errorResponse(res, "Not allowed to update this restaurant", 403);
    }

    Object.assign(restaurant, req.body);
    await restaurant.save();
    return successResponse(res, "Restaurant updated successfully", restaurant);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getRestaurants = async (req, res) => {
  const query = req.user?.role === "admin" ? {} : { isActive: { $ne: false }, $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }] };
  const restaurants = await Restaurant.find(query).sort("-createdAt");
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
